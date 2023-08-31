<template>
  <q-splitter
    style="position: absolute; width: 100%; height: 100%"
    v-model="rightMenuSize"
    :separator-class="{ 'q-splitter-separator': showRightMenu }"
    :disable="!showRightMenu"
    reverse
    :limits="[0, 60]"
    emit-immediately
    @update:model-value="(size) => resizeRightMenu(size)"
  >
    <template v-slot:before>
      <PDFToolBar
        style="
          position: absolute;
          top: 0;
          background: var(--color-pdfreader-toolbar-bkgd);
        "
        :pdfState="pdfApp.state"
        :pageLabels="pdfApp.pageLabels"
        :matchesCount="pdfApp.matchesCount"
        v-model:showRightMenu="showRightMenu"
      />
      <div
        ref="viewerContainer"
        class="viewerContainer"
      >
        <div class="pdfViewer"></div>
        <h5
          v-if="!project?.path"
          class="text-center"
        >
          {{ $t("no-pdf") }}
        </h5>
        <AnnotCard
          v-if="showAnnotCard && pdfApp.annotStore.selected"
          :style="style"
          :annot="(pdfApp.annotStore.selected as Annotation)"
        />
        <FloatingMenu
          v-if="showFloatingMenu"
          :style="style"
          @highlightText="(color: string) => highlightText(color)"
        />
      </div>

      <PeekCard
        v-for="link in pdfApp.peekManager.links"
        :key="link.id"
        :link="link"
        :peekManager="pdfApp.peekManager"
      />
    </template>
    <template v-slot:after>
      <RightMenu />
    </template>
  </q-splitter>
</template>

<script setup lang="ts">
import { ref, watch, provide, onMounted, computed } from "vue";
import {
  AnnotationData,
  AnnotationType,
  PDFState,
  Project,
  Rect,
} from "src/backend/database";
import { PDFPageView } from "pdfjs-dist/web/pdf_viewer";
import { KEY_pdfApp, KEY_project } from "./injectKeys";

import PDFToolBar from "./PDFToolBar.vue";
import RightMenu from "./RightMenu.vue";
import AnnotCard from "./AnnotCard.vue";
import FloatingMenu from "./FloatingMenu.vue";
import PeekCard from "./PeekCard.vue";

import { getProject } from "src/backend/project/project";
import PDFApplication from "src/backend/pdfreader";
import { Ink } from "src/backend/pdfannotation/annotations";
import { QSplitter, throttle, uid } from "quasar";
import { Annotation } from "src/backend/pdfannotation/annotations";

/**********************************
 * Props, Data, and component refs
 **********************************/
const props = defineProps({ projectId: { type: String, required: true } });

// viewer containers
const viewerContainer = ref<HTMLDivElement>();

// ready to save data
const project = ref<Project>();

// right menu (don't use stateStore since there will be many readerPages)
const rightMenuSize = ref(0);
const prvRightMenuSize = ref(0);
const showRightMenu = computed({
  get() {
    return rightMenuSize.value > 0;
  },
  set(visible: boolean) {
    if (visible) {
      rightMenuSize.value = Math.max(prvRightMenuSize.value, 15);
    } else {
      prvRightMenuSize.value = rightMenuSize.value;
      rightMenuSize.value = 0;
    }
  },
});

// annot card & colorpicker
const showAnnotCard = ref(false);
const showFloatingMenu = ref(false);
const selectionPage = ref(0);
const style = ref("");

// PDFApplicaiton
const pdfApp = new PDFApplication(props.projectId);
const renderEvt = ref<{
  pageNumber: number;
  source: PDFPageView;
  error: Error | null;
}>();

/******************************
 * RightMenu
 ******************************/
function resizeRightMenu(size: number) {
  if (size < 8) {
    rightMenuSize.value = 0;
    showRightMenu.value = false;
  }
  prvRightMenuSize.value = size > 10 ? size : 30;
}

/*******************************
 * AnnotCard & FloatingMenu
 *******************************/
/**
 * Toggle Floating Menu after text selection
 * @param page - the pageNumber where the selection is on
 */
function toggleFloatingMenu(show: boolean, page?: number) {
  if (!show) {
    showFloatingMenu.value = false;
  } else {
    // if no page is given, that means no seleciton
    if (!page) return;
    selectionPage.value = page;

    // find the selection on the page
    let hasSelection = false;
    let selection = window.getSelection();
    if (selection === null) return;
    let rects = [] as DOMRectList | DOMRect[];
    if (!!selection.focusNode) {
      rects = selection.getRangeAt(0).getClientRects();
      if (rects.length > 1) {
        hasSelection = true;
      } else if (rects.length == 1 && rects[0].width > 1) {
        hasSelection = true;
      } else {
        hasSelection = false;
      }
    }

    if (hasSelection) {
      showFloatingMenu.value = true;
      setPosition(rects);
    }
  }
}

function toggleAnnotCard(show: boolean, annot?: Annotation) {
  if (!show) {
    showAnnotCard.value = false;
  } else {
    if (!annot) return;
    setPosition(annot.doms.map((dom) => dom.getBoundingClientRect()));
    showAnnotCard.value = true;
  }
}

/**
 * Set position of FloatingMenu / AnnotCard
 * @param rects - doms of text selections / annotation
 */
function setPosition(rects: DOMRect[] | DOMRectList) {
  if (!viewerContainer.value) return;
  let viewer = viewerContainer.value.querySelector(
    "div.pdfViewer"
  ) as HTMLElement;
  let bgRect = viewer.getBoundingClientRect();
  let top = 0;
  let mid = 0;
  let n = 0; // number of non-empty rect
  for (let rect of rects) {
    if (rect.width < 0.1) continue;
    top = Math.max(top, rect.bottom);
    mid += (rect.left + rect.right) / 2;
    n++;
  }
  mid /= n; // averaged mid point

  style.value = `
  background: var(--color-pdfreader-colorpicker-bkgd);
  position: absolute;
  left: ${mid - bgRect.left - 75}px;
  top: ${top - bgRect.top + 20}px;
  min-width: 150px;
  z-index: 100;
  `;
}

function highlightText(color: string) {
  if (!renderEvt.value) return;
  let annot = pdfApp.annotFactory.buildSelectionBasedAnnot(
    AnnotationType.HIGHLIGHT,
    color,
    renderEvt.value
  );
  if (annot) {
    pdfApp.annotStore.add(annot, true);
    annot.draw(renderEvt.value);
    let annotId = annot.data._id;
    annot.doms.forEach((dom) => {
      dom.onmousedown = () => pdfApp.annotStore.setActive(annotId);
    });
    annot.hasEvtHandler = true;
  }
  toggleFloatingMenu(false);
}

/***************************
 * PDF realated
 ***************************/
async function loadPDF(id: string) {
  project.value = (await getProject(id)) as Project;
  if (project.value.dataType != "project") return;
  if (!project.value.path) return; // if no attached file
  // load state before loading pdf
  Object.assign(
    pdfApp.state,
    (await pdfApp.loadState(project.value._id)) as PDFState
  );
  await pdfApp.loadPDF(project.value.path);
  await pdfApp.loadAnnotations();
}

/******************
 * Provides
 ******************/
provide(KEY_project, project);
provide(KEY_pdfApp, pdfApp);

/***********************
 * Watchers
 ***********************/
watch(pdfApp.state, (state) => {
  // pdfState is reactive, so it's deep wather automatically
  if (!pdfApp.ready.value) return;
  pdfApp.saveState(state);
});

/**************************************************
 * Implement eventhandlers and init PDFApplication
 **************************************************/
onMounted(async () => {
  if (!viewerContainer.value) return;
  pdfApp.init(viewerContainer.value as HTMLDivElement);
  window.pdfApp = pdfApp;

  pdfApp.eventBus?.on(
    "annotationeditorlayerrendered",
    async (e: {
      error: Error | null;
      pageNumber: number;
      source: PDFPageView;
    }) => {
      // draw annotations on active page
      let annots = pdfApp.annotStore.getByPage(e.pageNumber);
      let inkAnnot: Ink | undefined = undefined;
      let clickedAnnotId: string;
      for (let annot of annots) {
        // draw annotations (create Konva stage if it's ink)
        annot.draw(e);
        if (annot.data.type === AnnotationType.INK) {
          // bind event handlers to Konva stage
          inkAnnot = annot as Ink;
          inkAnnot.bindEventHandlers(pdfApp.state);
        } else {
          // bind event handlers to doms
          if (
            annot.data.type === AnnotationType.RECTANGLE ||
            annot.data.type === AnnotationType.COMMENT
          )
            annot.enableDragToMove();
        }
      }

      // monitor tool change and create konva stage as needed
      e.source.div.onmousemove = throttle(() => {
        if (
          pdfApp.state.tool === AnnotationType.INK ||
          pdfApp.state.tool === AnnotationType.ERASER
        ) {
          // in freedraw mose
          if (!inkAnnot) {
            // create canvas if there is none
            let annotData = {
              _id: uid(),
              _rev: "",
              timestampAdded: Date.now(),
              timestampModified: Date.now(),
              dataType: "pdfAnnotation",
              projectId: props.projectId,
              pageNumber: e.pageNumber,
              content: "",
              color: "",
              rects: [] as Rect[],
              type: AnnotationType.INK,
            } as AnnotationData;
            let annot = pdfApp.annotFactory.build(annotData);
            if (annot) {
              pdfApp.annotStore.add(annot, true);
              inkAnnot = annot as Ink;
              inkAnnot.draw(e);
              inkAnnot.bindEventHandlers(pdfApp.state);
            }
          }
          inkAnnot?.setDrawable(true);
        } else {
          inkAnnot?.setDrawable(false);
        }
      }, 500);

      // event handlers to handle user interactions
      e.source.div.onmousedown = (ev: MouseEvent) => {
        toggleAnnotCard(false);
        toggleFloatingMenu(false);
        // if clicking on an annotation, set it active and return;
        clickedAnnotId =
          (ev.target as HTMLElement).getAttribute("annotation-id") ||
          ((ev.target as HTMLElement).parentNode as HTMLElement).getAttribute(
            "annotation-id"
          ) ||
          "";
        pdfApp.annotStore.setActive(clickedAnnotId);
        if (clickedAnnotId) {
          e.source.div.onmouseup = () => {
            toggleAnnotCard(true, pdfApp.annotStore.selected as Annotation);
          };
          return;
        }

        // otherwise continue to determine what user is doing
        switch (pdfApp.state.tool) {
          case AnnotationType.CURSOR:
            e.source.div.onmouseup = () => {
              toggleFloatingMenu(true, e.pageNumber);
              renderEvt.value = e;
            };
            break;
          case AnnotationType.HIGHLIGHT:
          case AnnotationType.UNDERLINE:
          case AnnotationType.STRIKEOUT:
            e.source.div.onmouseup = () => {
              let annot = pdfApp.annotFactory.buildSelectionBasedAnnot(
                pdfApp.state.tool,
                pdfApp.state.color,
                e
              );
              if (annot) {
                pdfApp.annotStore.add(annot, true);
                annot.draw(e);
              }
            };
            break;
          case AnnotationType.RECTANGLE:
            let canvasWrapper = e.source.div.querySelector(
              ".canvasWrapper"
            ) as HTMLElement;
            // temporary rectangle for rectangular highlight
            let x1 = ev.clientX;
            let y1 = ev.clientY;
            let layerRect = canvasWrapper.getBoundingClientRect();
            let tempRect = document.createElement("div");
            tempRect.style.position = "absolute";
            tempRect.style.background = pdfApp.state.color;
            tempRect.style.mixBlendMode = "multiply";
            tempRect.style.left = `${x1 - layerRect.x}px`;
            tempRect.style.top = `${y1 - layerRect.y}px`;
            canvasWrapper.append(tempRect);

            e.source.div.onmousemove = (ev: MouseEvent) => {
              ev.preventDefault();
              if (!tempRect) return;
              tempRect.style.width = `${ev.clientX - x1}px`;
              tempRect.style.height = `${ev.clientY - y1}px`;
            };
            e.source.div.onmouseup = (ev: MouseEvent) => {
              tempRect.remove();
              // create annotation
              let rects = [
                {
                  left: Math.min(x1, ev.clientX),
                  top: Math.min(y1, ev.clientY),
                  width: Math.abs(x1 - ev.clientX),
                  height: Math.abs(y1 - ev.clientY),
                },
              ];
              if (rects[0].width < 1 || rects[0].height < 1) return;
              rects[0] = pdfApp.annotFactory.offsetTransform(
                rects[0],
                canvasWrapper
              );

              let annotData = {
                _id: uid(),
                _rev: "",
                timestampAdded: Date.now(),
                timestampModified: Date.now(),
                type: AnnotationType.RECTANGLE,
                rects: rects,
                color: pdfApp.state.color,
                pageNumber: e.pageNumber,
                projectId: pdfApp.state.projectId,
                dataType: "pdfAnnotation",
                content: "",
              } as AnnotationData;
              let annot = pdfApp.annotFactory.build(annotData);
              if (annot) {
                annot.draw(e);
                pdfApp.annotStore.add(annot, true);
              }
              e.source.div.onmousemove = null;
              e.source.div.onmouseup = null;
            };
            break;
          case AnnotationType.COMMENT:
            e.source.div.onmouseup = (ev: MouseEvent) => {
              let canvasWrapper = e.source.div.querySelector(
                ".canvasWrapper"
              ) as HTMLElement;
              // create annotation
              let rects = [
                {
                  left: ev.clientX,
                  top: ev.clientY,
                  width: 0,
                  height: 0,
                },
              ];
              rects[0] = pdfApp.annotFactory.offsetTransform(
                rects[0],
                canvasWrapper
              );
              let annotData = {
                _id: uid(),
                _rev: "",
                timestampAdded: Date.now(),
                timestampModified: Date.now(),
                type: AnnotationType.COMMENT,
                rects: rects,
                color: pdfApp.state.color,
                pageNumber: e.pageNumber,
                projectId: pdfApp.state.projectId,
                dataType: "pdfAnnotation",
                content: "",
              } as AnnotationData;
              let annot = pdfApp.annotFactory.build(annotData);
              if (annot) {
                annot.draw(e);
                pdfApp.annotStore.add(annot, true);
              }
            };
            break;
        }
      };
    }
  );

  loadPDF(props.projectId);
});
</script>
<style lang="scss">
@use "pdfjs-dist/web/pdf_viewer.css";

.viewerContainer {
  position: absolute;
  overflow: auto;
  // toolbar: 36px
  height: calc(100% - 36px);
  top: 36px;
  width: 100%; // so the right scroll bar does not touch right edge
  margin-right: 10px;
  background-color: var(--color-pdfreader-viewer-bkgd);
}

.page {
  // fix no gap between pages
  box-sizing: unset;
}

.hidden,
[hidden] {
  // fix pdfjs-dist 3.7.107 standard annot popup won't hidden
  display: none !important;
}

.activeAnnotation {
  outline-offset: 3px;
  outline: dashed 2px $primary;
}

// fix popup not correctly rendered
.annotationLayer .popup {
  // fix white text color in standard annotations
  // standard annotation means annotation made by adobe pdf etc
  color: black;
}

.annotationLayer .popup h1 {
  // fix weird title in standard annotation
  font-weight: bold;
  line-height: unset;
  letter-spacing: unset;
}

// .annotationEditorLayer will be hidden if there is no pdfjs-generated annotation
// do not hide user injected annotations
.annotationEditorLayer {
  display: unset !important;
}
</style>
