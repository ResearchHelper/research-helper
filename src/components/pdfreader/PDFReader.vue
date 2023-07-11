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
    ref="pdfreader"
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
        :matchesCount="matchesCount"
        v-model:showRightMenu="showRightMenu"
        @changePageNumber="changePageNumber"
        @changeScale="changeScale"
        @changeSpreadMode="changeSpreadMode"
        @changeTool="changeTool"
        @changeColor="changeColor"
        @changeInkThickness="changeInkThickness"
        @changeInkOpacity="changeInkOpacity"
        @searchText="searchText"
        @changeMatch="changeMatch"
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
          v-if="showAnnotCard"
          :style="style"
          :annot="(annotStore.getById(annotStore.selectedId) as Annotation)"
        />
        <FloatingMenu
          v-if="showFloatingMenu"
          :style="style"
          @highlightText="(color: string) => {
          annotFactory.buildSelectionBasedAnnot(AnnotationType.HIGHLIGHT,color,selectionPage)
          toggleFloatingMenu();
        }"
        />
      </div>

      <div
        ref="peekContainer"
        class="peekContainer"
      >
        <div class="pdfViewer"></div>
      </div>
    </template>
    <template v-slot:after>
      <RightMenu />
    </template>
  </q-splitter>
</template>

<script setup lang="ts">
import {
  ref,
  reactive,
  watch,
  nextTick,
  provide,
  onMounted,
  computed,
} from "vue";
import {
  AnnotationType,
  PDFSearch,
  PDFState,
  Project,
  SpreadMode,
  TOCNode,
} from "src/backend/database";
import { AnnotationEditorType, AnnotationEditorParamsType } from "pdfjs-dist";
import {
  PDFFindController,
  PDFPageView,
  PDFViewer,
} from "pdfjs-dist/web/pdf_viewer";
import {
  KEY_scrollAnnotIntoView,
  KEY_clickTOC,
  KEY_outline,
  KEY_project,
  KEY_annotStore,
} from "./injectKeys";

import PDFToolBar from "./PDFToolBar.vue";
import RightMenu from "./RightMenu.vue";
import AnnotCard from "./AnnotCard.vue";
import FloatingMenu from "./FloatingMenu.vue";

import { getProject } from "src/backend/project/project";
import { PDFApplication } from "src/backend/pdfreader";
import { AnnotationFactory, AnnotationStore } from "src/backend/pdfannotation";
import { QSplitter } from "quasar";
import { Annotation } from "src/backend/pdfannotation/annotations";

/**
 * Props, Data, and component refs
 */
const props = defineProps({ projectId: { type: String, required: true } });

// viewer containers
const pdfreader = ref<InstanceType<typeof QSplitter>>();
const viewerContainer = ref<HTMLDivElement>();
const peekContainer = ref<HTMLDivElement>();

// ready to save data
const ready = ref(false);
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

// pdf related
const pdfState = reactive<PDFState>({} as PDFState);
const matchesCount = reactive({ current: -1, total: 0 });
const pageLabels = ref<string[]>([]);
const outline = ref<TOCNode[]>([]);
const inkAnnotIdMap = new Map<string, string>();

// annot card & colorpicker
const showAnnotCard = ref(false);
const showFloatingMenu = ref(false);
const selectionPage = ref(0);
const style = ref("");

let pdfApp: PDFApplication;
let annotFactory: AnnotationFactory;
const annotStore = new AnnotationStore();

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
  pdfApp.pdfViewer.annotationEditorParams = {
    type: AnnotationEditorParamsType.INK_COLOR,
    value: color,
  };
}

function changeInkThickness(thickness: number) {
  pdfState.inkThickness = thickness;
  pdfApp.pdfViewer.annotationEditorParams = {
    type: AnnotationEditorParamsType.INK_THICKNESS,
    value: thickness,
  };
}

function changeInkOpacity(opacity: number) {
  pdfState.inkOpacity = opacity;
  pdfApp.pdfViewer.annotationEditorParams = {
    type: AnnotationEditorParamsType.INK_OPACITY,
    value: opacity,
  };
}

function changeTool(tool: AnnotationType) {
  pdfState.tool = tool;

  // Ink tool is a built-in pdf.js tool
  if (tool === AnnotationType.INK) {
    pdfApp.pdfViewer.annotationEditorMode = AnnotationEditorType.INK;
  } else pdfApp.pdfViewer.annotationEditorMode = AnnotationEditorType.NONE; // cursor mode
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

  // show annot card
  if (!annotStore.selectedId) return;
  let annot = annotStore.getById(annotStore.selectedId) as Annotation;
  setPosition(annot.doms.map((dom) => dom.getBoundingClientRect()));
  showAnnotCard.value = true;
}

/**
 * Set position of FloatingMenu / AnnotCard
 * @param rects - doms of text selections / annotation
 */
function setPosition(rects: DOMRect[] | DOMRectList) {
  if (!viewerContainer.value) return;

  let bgRect = (viewerContainer.value as HTMLElement).getBoundingClientRect();
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
  left: ${mid - bgRect.left - 100}px;
  top: ${top - bgRect.top + 20}px;
  min-width: 150px;
  z-index: 100;
  `;
}

/**
 * Provides
 */
provide(KEY_scrollAnnotIntoView, scrollAnnotIntoView);
provide(KEY_annotStore, annotStore);
provide(KEY_clickTOC, clickTOC);
provide(KEY_outline, outline);
provide(KEY_project, project);

/**
 * Watchers
 */

watch(pdfState, (state) => {
  // pdfState is reactive, so it's deep wather automatically
  if (!ready.value) return;
  pdfApp.saveState(state);
});

async function scrollAnnotIntoView(annotId: string) {
  await nextTick();
  annotStore.setActive("");
  if (!!!annotId) return;
  let annot = annotStore.getById(annotId) as Annotation;
  // change number first in case the dom is not rendered
  changePageNumber(annot.data.pageNumber);
  setTimeout(() => {
    annot.doms[0].scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
    annotStore.setActive(annotId);
  }, 200);
}

function resizeRightMenu(size: number) {
  if (size < 8) {
    rightMenuSize.value = 0;
    showRightMenu.value = false;
  }
  prvRightMenuSize.value = size > 10 ? size : 30;
}

onMounted(async () => {
  if (!viewerContainer.value || !peekContainer.value) return;
  pdfApp = new PDFApplication(
    viewerContainer.value as HTMLDivElement,
    peekContainer.value as HTMLDivElement
  );

  annotFactory = new AnnotationFactory(
    viewerContainer.value,
    pdfState,
    annotStore
  );
  // create annotations from db
  let annotDatas = await annotStore.loadFromDB(props.projectId);
  for (let annotData of annotDatas) {
    let annot = annotFactory.build(annotData);
    if (annot) annotStore.add(annot);
  }

  pdfApp.eventBus.on("pagesinit", () => {
    changePageNumber(pdfState.currentPageNumber);
    changeSpreadMode(pdfState.spreadMode);
    changeScale({ scale: pdfState.currentScale });
    changeTool(pdfState.tool);
    pdfState.pagesCount = pdfApp.pdfViewer.pagesCount;
    ready.value = true;
  });
  pdfApp.eventBus.on(
    "annotationeditorlayerrendered",
    (e: { error: Error | null; pageNumber: number; source: PDFPageView }) => {
      let annots = annotStore.getByPage(e.pageNumber);
      for (let annot of annots) {
        annot.draw();
        // bind event handlers to doms
        annot.doms.forEach((dom) => {
          dom.onmousedown = () => annotStore.setActive(annot.data._id);
          if (
            annot.data.type === AnnotationType.RECTANGLE ||
            annot.data.type === AnnotationType.COMMENT
          )
            annot.enableDragToMove();
        });
      }

      annotFactory.setState(pdfState);
      annotFactory.setEventHandlers(e);
      e.source.div.addEventListener("mousedown", (ev) => {
        let clickedAnnotId: string | null =
          (ev.target as HTMLElement).getAttribute("annotation-id") ||
          ((ev.target as HTMLElement).parentNode as HTMLElement).getAttribute(
            "annotation-id"
          );
        annotStore.setActive(clickedAnnotId || "");
      });
      e.source.div.addEventListener("mouseup", () => {
        if (pdfState.tool === AnnotationType.CURSOR)
          toggleFloatingMenu(e.pageNumber);
        console.log("active", annotStore.selectedId);
        toggleAnnotCard();
      });
    }
  );
  pdfApp.eventBus.on(
    "pagechanging",
    async (e: {
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
        if (!viewerContainer.value) return;
        await nextTick();
        (viewerContainer.value as HTMLElement).scrollTo(
          pdfState.scrollLeft,
          pdfState.scrollTop
        );
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

// fix ink editor not correctly rendered
.disabled,
.disabled *,
[disabled],
[disabled] * {
  cursor: unset !important;
  outline: unset !important;
}

.annotationEditorLayer .selectedEditor {
  outline: var(--focus-outline) !important;
}

.annotationEditorLayer :is(.freeTextEditor, .inkEditor)[draggable="true"] {
  cursor: move !important;
}

.annotationEditorLayer
  :is(.freeTextEditor, .inkEditor):hover:not(.selectedEditor) {
  outline: var(--hover-outline) !important;
}

// .annotationEditorLayer will be hidden if there is no pdfjs-generated annotation
// do not hide user injected annotations
.annotationEditorLayer {
  display: unset !important;
}
</style>
