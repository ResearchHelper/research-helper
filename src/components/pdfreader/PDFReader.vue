<template>
  <q-splitter
    style="position: absolute; width: 100%; height: 100%"
    v-model="rightMenuSize"
    separator-class="q-splitter-separator"
    reverse
    :limits="[0, 60]"
  >
    <template v-slot:before>
      <PDFToolBar
        style="
          position: absolute;
          top: 0;
          background: var(--color-pdfreader-toolbar-bkgd);
        "
        :pdfState="pdfState"
        :pageLabels="pageLabels"
        :rightMenuSize="rightMenuSize"
        :matchesCount="matchesCount"
        @changePageNumber="changePageNumber"
        @changeScale="changeScale"
        @changeSpreadMode="changeSpreadMode"
        @changeTool="changeTool"
        @changeColor="changeColor"
        @searchText="searchText"
        @changeMatch="changeMatch"
        @toggleRightMenu="toggleRightMenu"
      />

      <div
        ref="viewerContainer"
        class="viewerContainer"
      >
        <div
          ref="viewer"
          class="pdfViewer"
        ></div>
        <AnnotCard
          v-if="showAnnotCard && selectedAnnotId"
          :style="style"
          :annot="getAnnot(selectedAnnotId)"
        />
        <FloatingMenu
          v-if="showFloatingMenu"
          :style="style"
          @highlightText="(color: string) => {
              createAnnot(AnnotationType.HIGHLIGHT, color, selectionPage, null); 
              toggleFloatingMenu();
            }"
        />
      </div>

      <div
        ref="peekContainer"
        class="peekContainer"
      >
        <div
          ref="peekViewer"
          class="pdfViewer"
        ></div>
      </div>
    </template>
    <template v-slot:after>
      <RightMenu />
    </template>
  </q-splitter>
</template>

<script setup lang="ts">
import { ref, reactive, watch, nextTick, provide, onMounted } from "vue";
import {
  Annotation,
  AnnotationType,
  PDFSearch,
  PDFState,
  Project,
  SpreadMode,
  TOCNode,
} from "src/backend/database";
import {
  PDFFindController,
  PDFPageView,
  PDFViewer,
} from "pdfjs-dist/web/pdf_viewer";
import {
  KEY_updateAnnot,
  KEY_deleteAnnot,
  KEY_clickTOC,
  KEY_outline,
  KEY_project,
  KEY_annots,
  KEY_setActiveAnnot,
  KEY_selectedAnnotId,
  KEY_createAnnot,
  KEY_getAnnot,
} from "./injectKeys";

import PDFToolBar from "./PDFToolBar.vue";
import RightMenu from "./RightMenu.vue";
import AnnotCard from "./AnnotCard.vue";
import FloatingMenu from "./FloatingMenu.vue";

import { PDFApplication } from "src/backend/pdfreader";
import { getProject } from "src/backend/project/project";

import {
  getAnnotations,
  addAnnotation,
  updateAnnotation,
  deleteAnnotation,
  createAnnotation,
  drawAnnotation,
  enableDragToMove,
} from "src/backend/pdfannotation";
import { copyToClipboard } from "quasar";

/**
 * Props, Data, and component refs
 */
const props = defineProps({ projectId: { type: String, required: true } });

// viewer containers
const viewerContainer = ref(null);
const peekContainer = ref(null);
const viewer = ref(null);

// ready to save data
const ready = ref(false);
const project = ref<Project | null>(null);

// right menu
const prvRightMenuSize = ref(25);
const rightMenuSize = ref(0);

// pdf related
const pdfState = reactive<PDFState>({} as PDFState);
const matchesCount = reactive({ current: -1, total: 0 });
const pageLabels = ref<string[]>([]);
const outline = ref<TOCNode[]>([]);
const annots = ref<Annotation[]>([]);
const selectedAnnotId = ref("");

// annot card & colorpicker
const showAnnotCard = ref(false);
const showFloatingMenu = ref(false);
const selectionPage = ref(0);
const style = ref("");

let pdfApp: PDFApplication;

/**
 * Methods
 */
async function loadPDF(id: string) {
  project.value = (await getProject(id)) as Project;
  if (project.value.dataType != "project") return;
  if (!project.value.path) return; // if no attached file
  // load state before loading pdf
  Object.assign(
    pdfState,
    (await pdfApp.loadState(project.value._id)) as PDFState
  );
  annots.value = (await getAnnotations(props.projectId)) as Annotation[];
  await pdfApp.loadPDF(project.value.path);
  outline.value = await pdfApp.getTOC();
  pageLabels.value = await pdfApp.getPageLabels();
}

/**********************************
 * PDFApplication - PdfViewer
 **********************************/
function changePageNumber(pageNumber: number) {
  pdfApp.changePageNumber(pageNumber);
  // pdfState is modified in pagechanging event
}
function changeScale(params: {
  delta?: number;
  scaleValue?: "page-width" | "page-height";
  scale?: number;
}) {
  pdfApp.changeScale(params);
  // pdfState is modified in scalechanging event
}
function changeSpreadMode(spreadMode: SpreadMode) {
  pdfApp.changeSpreadMode(spreadMode);
  pdfState.spreadMode = spreadMode;
}

/**********************************
 * PDFApplication - Find Controller
 **********************************/
function searchText(search: PDFSearch) {
  pdfApp.searchText(search);
}
function changeMatch(delta: number) {
  pdfApp.changeMatch(delta);
}

/**********************************
 * PDFApplication - TOC
 **********************************/
function clickTOC(node: TOCNode) {
  pdfApp.clickTOC(node);
}

/**********************************
 * Annotation
 **********************************/
function changeColor(color: string) {
  pdfState.color = color;
}

function changeTool(tool: AnnotationType) {
  pdfState.tool = tool;
}

function getAnnot(annotId: string): Annotation {
  return annots.value.find((annot) => annot._id === annotId) as Annotation;
}

function setActiveAnnot(annotId: string) {
  if (viewerContainer.value === null) return;
  selectedAnnotId.value = annotId;

  if (!!annotId) {
    // highlight it
    (viewerContainer.value as HTMLElement)
      .querySelectorAll(`section[annotation-id="${annotId}"]`)
      .forEach((dom) => {
        dom.classList.add("activeAnnotation");
      });
  } else {
    // deselect annotation
    (viewerContainer.value as HTMLElement)
      .querySelectorAll(".activeAnnotation")
      .forEach((dom) => {
        dom.classList.remove("activeAnnotation");
      });
  }
}
async function createAnnot(
  tool: AnnotationType,
  color: string,
  pageNumber: number,
  corner: { x1: number; y1: number; x2: number; y2: number } | null
) {
  if (viewerContainer.value === null) return;

  let annot = createAnnotation(
    viewerContainer.value as HTMLElement,
    pageNumber,
    tool,
    color,
    props.projectId,
    corner
  );

  if (!annot) return;
  // update ui
  annots.value.push(annot); // update list
  drawAnnot(annot); // draw it on pdf
  window.getSelection()?.empty(); // clear any text selection
  // update db
  await addAnnotation(annot);
}

/**
 * Draw annotation on annotationEditorLayer
 * @param annot
 */
async function drawAnnot(annot: Annotation) {
  if (viewerContainer.value === null) return;

  let doms = drawAnnotation(viewerContainer.value as HTMLElement, annot);

  // click to highlight annotation
  for (let [i, dom] of doms.entries()) {
    dom.onclick = () => {
      setActiveAnnot(dom.getAttribute("annotation-id") as string);
    };
  }

  // enable dragging for annotation
  if (
    annot.type === AnnotationType.COMMENT ||
    annot.type === AnnotationType.RECTANGLE
  ) {
    enableDragToMove(doms[0]);
  }
}

async function updateAnnot(params: { id: string; data: any }) {
  let id = params.id;
  let data = params.data;
  if (id === undefined || data === undefined) return;

  // update db
  let annot = (await updateAnnotation(params.id, params.data)) as Annotation;

  // update PDFReader UI
  if ("color" in data) {
    document
      .querySelectorAll(`section[annotation-id="${id}"]`)
      .forEach((dom) => {
        if (
          annot.type === AnnotationType.UNDERLINE ||
          annot.type === AnnotationType.STRIKEOUT
        )
          (dom as HTMLElement).style.borderBottomColor = data.color;
        else (dom as HTMLElement).style.background = data.color;
      });
  }
  // update AnnotationList UI
  for (let i in annots.value) {
    if (annots.value[i]._id == annot._id) {
      annots.value[i] = annot;
    }
  }
}

async function deleteAnnot(id: string) {
  // update db
  await deleteAnnotation(id);

  // close any annot menu
  showAnnotCard.value = false;
  // update PDFReader UI
  document.querySelectorAll(`section[annotation-id="${id}"]`).forEach((dom) => {
    dom.remove();
  });
  // update AnnotationList UI
  annots.value = annots.value.filter((annot) => annot._id != id);
}

/*******************************
 * AnnotCard & FloatingMenu
 *******************************/
/**
 * Toggle Floating Menu after text selection
 * @param page - the pageNumber where the selection is on
 */
async function toggleFloatingMenu(page?: number) {
  // close all menus first
  showAnnotCard.value = false;
  showFloatingMenu.value = false;
  await nextTick();

  // close floatingMenu if pageNumber (means no selection)
  if (!page) return;
  selectionPage.value = page;

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

async function toggleAnnotCard() {
  // close all menus first
  showAnnotCard.value = false;
  showFloatingMenu.value = false;
  await nextTick();

  if (!selectedAnnotId.value) return;

  // show annot card
  let doms = document.querySelectorAll(
    `section[annotation-id="${selectedAnnotId.value}"]`
  );
  let rects = [];
  for (let dom of doms) rects.push(dom.getBoundingClientRect());
  showAnnotCard.value = true;
  setPosition(rects);
}

/**
 * Set position of FloatingMenu / AnnotCard
 * @param rects - doms of text selections / annotation
 */
function setPosition(rects: DOMRect[] | DOMRectList) {
  if (viewer.value === null) return;

  let bgRect = (viewer.value as HTMLElement).getBoundingClientRect();
  // unit: px
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
  top: ${top - bgRect.top + 10}px;
  min-width: 150px;
  z-index: 100;
  `;
}

/**********************************
 * RightMenu
 **********************************/
function toggleRightMenu(visible: boolean) {
  if (visible) {
    rightMenuSize.value = prvRightMenuSize.value;
  } else {
    // record the rightmenu size for next use
    prvRightMenuSize.value = rightMenuSize.value;
    rightMenuSize.value = 0;
  }
}

/**
 * Provides
 */
provide(KEY_getAnnot, getAnnot);
provide(KEY_createAnnot, createAnnot);
provide(KEY_updateAnnot, updateAnnot);
provide(KEY_deleteAnnot, deleteAnnot);
provide(KEY_setActiveAnnot, setActiveAnnot);
provide(KEY_clickTOC, clickTOC);
provide(KEY_selectedAnnotId, selectedAnnotId);
provide(KEY_outline, outline);
provide(KEY_project, project);
provide(KEY_annots, annots);

/**
 * Watchers
 */

watch(pdfState, (state) => {
  // pdfState is reactive, so it's deep wather automatically
  if (!ready.value) return;
  pdfApp.saveState(state);
});

watch(selectedAnnotId, (annotId) => {
  setActiveAnnot("");
  if (!!!annotId) return;

  // scroll to the selected annot
  if (viewerContainer.value === null) return;
  let dom = (viewerContainer.value as HTMLElement).querySelector(
    `section[annotation-id="${annotId}"]`
  );
  if (!!dom) {
    // if the dom is already there, scroll into view
    dom.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
    setActiveAnnot(annotId);
  } else {
    // otherwise change the page first
    let annot = annots.value.find(
      (annot) => annot._id === annotId
    ) as Annotation;
    changePageNumber(annot.pageNumber);
  }
});

/**
 * onMounted
 */

onMounted(async () => {
  if (!viewerContainer.value || !peekContainer.value) return;
  pdfApp = new PDFApplication(
    viewerContainer.value as HTMLDivElement,
    peekContainer.value as HTMLDivElement
  );
  pdfApp.eventBus.on("pagesinit", () => {
    changePageNumber(pdfState.currentPageNumber);
    changeSpreadMode(pdfState.spreadMode);
    changeScale({ scale: pdfState.currentScale });
    pdfState.pagesCount = pdfApp.pdfViewer.pagesCount;
    ready.value = true;
  });
  pdfApp.eventBus.on(
    "annotationeditorlayerrendered",
    (e: { error: Error | null; pageNumber: number; source: PDFPageView }) => {
      // draw annotations from db
      let annotsOnPage = annots.value.filter(
        (annot) => annot.pageNumber === e.pageNumber
      );
      for (let annot of annotsOnPage) drawAnnot(annot);
      // handle user's mouse event
      e.source.div.onmousedown = (ev) => {
        // determine if user is clicking on an annotation
        if (!ev.target) return;
        let clickedAnnotId: string | null =
          (ev.target as HTMLElement).getAttribute("annotation-id") ||
          ((ev.target as HTMLElement).parentNode as HTMLElement).getAttribute(
            "annotation-id"
          );
        // temporary rectangle for rectangular highlight
        let x1 = ev.clientX;
        let y1 = ev.clientY;
        let tempRect: HTMLElement;
        if (!clickedAnnotId && pdfState.tool === AnnotationType.RECTANGLE) {
          if (viewerContainer.value === null) return;
          let annotLayer = (viewerContainer.value as HTMLElement)
            ?.querySelector(
              `div.page[data-page-number='${pdfState.currentPageNumber}']`
            )
            ?.querySelector(".annotationEditorLayer") as HTMLElement;
          let layerRect = annotLayer.getBoundingClientRect();
          tempRect = document.createElement("div");
          tempRect.style.position = "absolute";
          tempRect.style.background = pdfState.color;
          tempRect.style.mixBlendMode = "multiply";
          tempRect.style.left = `${x1 - layerRect.x}px`;
          tempRect.style.top = `${y1 - layerRect.y}px`;
          annotLayer.append(tempRect);
          e.source.div.onmousemove = (ev) => {
            ev.preventDefault();
            tempRect.style.width = `${ev.clientX - x1}px`;
            tempRect.style.height = `${ev.clientY - y1}px`;
          };
        }
        // draw annotations when mouse is up
        e.source.div.onmouseup = async (ev) => {
          if (clickedAnnotId) {
            setActiveAnnot(clickedAnnotId);
            toggleAnnotCard();
          } else {
            setActiveAnnot("");
            if (pdfState.tool === AnnotationType.CURSOR) {
              // toggle menu under text selection
              toggleFloatingMenu(e.pageNumber);
            } else {
              await createAnnot(pdfState.tool, pdfState.color, e.pageNumber, {
                x1,
                y1,
                x2: ev.clientX,
                y2: ev.clientY,
              });
              // change back to cursor if comment is placed
              // otherwise it's easy to create another one while user just want to click meaninglessly
              if (pdfState.tool === AnnotationType.COMMENT)
                changeTool(AnnotationType.CURSOR);
            }
          }
          e.source.div.onmousemove = null;
          if (tempRect) tempRect.remove();
        };
      };
    }
  );
  pdfApp.eventBus.on(
    "pagechanging",
    (e: {
      source: PDFViewer;
      pageNumber: number;
      pageLabels: string | null;
      previous: number;
    }) => {
      // update pdfState when scrolling
      pdfState.currentPageNumber = e.pageNumber;
      // if the pdf is initially loaded, scroll to last position
      // this line is here because if the scrollto is called too early
      // then the position will be slightly different each time
      // do not remove if (!ready) otherwise pdf can't scroll
      if (!ready.value) {
        if (viewerContainer.value === null) return;
        (viewerContainer.value as HTMLElement).scrollTo(
          pdfState.scrollLeft,
          pdfState.scrollTop
        );
        ready.value = true;
      }
    }
  );
  pdfApp.eventBus.on(
    "scalechanging",
    (e: {
      source: PDFPageView;
      scale: number;
      presetValue: string | undefined;
    }) => {
      // let pdfApp calculate the scale, then change the pdfState
      pdfState.currentScale = e.scale;
      if (e.presetValue) pdfState.currentScaleValue = e.presetValue;
    }
  );
  // find controller
  pdfApp.eventBus.on(
    "updatefindmatchescount",
    (e: {
      source: PDFFindController;
      matchesCount: { current: number; total: number };
    }) => {
      // update the current/total founded during searching
      // this will only fired when something found
      Object.assign(matchesCount, e.matchesCount);
    }
  );
  pdfApp.eventBus.on(
    "updatetextlayermatches",
    (e: { source: PDFFindController; pageIndex: number }) => {
      // if not found, set the matchesCount.total to 0
      let findController = e.source;
      let selected = findController.selected;
      if (selected === undefined) return;
      if (findController.pageMatches === undefined) return;
      if (selected.matchIdx == -1 && selected.pageIdx == -1) {
        Object.assign(matchesCount, { current: -1, total: 0 });
      } else {
        let pageIdx = selected.pageIdx;
        let current = selected.matchIdx + 1;
        for (let i = 0; i < pageIdx; i++) {
          current += findController.pageMatches[i].length;
        }
        matchesCount.current = current;
      }
    }
  );
  loadPDF(props.projectId);
});
</script>
<style lang="scss">
@import "pdfjs-dist/web/pdf_viewer.css";
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

.peekContainer {
  position: absolute;
  overflow: auto;
  background: var(--color-pdfreader-viewer-bkgd);
  border: solid $primary 3px;
}

.page {
  // fix no gap between pages
  box-sizing: unset;
}

.annotationEditorLayer {
  // for pdfjs-dist ~ 3.6
  z-index: unset;
  display: block;
}

.activeAnnotation {
  outline-offset: 3px;
  outline: dashed 2px $primary;
}

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
</style>
