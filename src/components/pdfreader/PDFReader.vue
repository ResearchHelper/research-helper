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
        v-model:pdfState="pdfState"
        :pageLabels="pageLabels"
        :rightMenuSize="rightMenuSize"
        :matchesCount="matchesCount"
        @changePageNumber="changePageNumber"
        @changeScale="changeScale"
        @changeSpreadMode="changeSpreadMode"
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
          v-if="showAnnotCard"
          :style="style"
          :annot="annots.find((annot: Annotation) => annot._id === selectedAnnotId)"
        />
        <div
          v-if="showColorPicker"
          :style="style"
          class="q-px-sm q-py-xs"
        >
          <ColorPicker
            @selected="
            (color: string) => createAnnot(AnnotationType.HIGHLIGHT, color, selectionPage, {}, true)
          "
          />
        </div>
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

<script lang="ts">
import { defineComponent, computed } from "vue";
import {
  Annotation,
  AnnotationType,
  PDFState,
  Project,
  TOCNode,
} from "src/backend/database";
import { PDFFindController, PDFPageView } from "pdfjs-dist/web/pdf_viewer";
import {
  KEY_updateAnnot,
  KEY_deleteAnnot,
  KEY_clickTOC,
  KEY_outline,
  KEY_project,
  KEY_annots,
  KEY_setActiveAnnot,
  KEY_selectedAnnotId,
} from "./injectKeys";

import PDFToolBar from "./PDFToolBar.vue";
import RightMenu from "./RightMenu.vue";
import AnnotCard from "./AnnotCard.vue";
import ColorPicker from "./ColorPicker.vue";

import { PDFApplication } from "src/backend/pdfreader/pdfreader";
import { useStateStore } from "src/stores/appState";
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

export default defineComponent({
  props: { projectId: { type: String, required: true } },

  components: {
    PDFToolBar,
    AnnotCard,
    ColorPicker,
    RightMenu,
  },

  setup() {
    const stateStore = useStateStore();
    return { stateStore, AnnotationType };
  },

  data() {
    return {
      ready: false,
      project: null as Project | null,

      // right menu
      prvRightMenuSize: 25,
      rightMenuSize: 0,
      rightMenuTab: "metaInfoTab",

      // pdf related
      pdfState: {} as PDFState,
      matchesCount: { current: -1, total: 0 },
      pageLabels: [],
      outline: [],
      annots: [] as Annotation[],
      selectedAnnotId: "",

      // annot card & colorpicker
      showAnnotCard: false,
      showColorPicker: false,
      selectionPage: 0,
      style: "",
    };
  },

  provide() {
    return {
      [KEY_updateAnnot]: this.updateAnnot,
      [KEY_deleteAnnot]: this.deleteAnnot,
      [KEY_clickTOC]: this.clickTOC,
      [KEY_setActiveAnnot]: this.setActiveAnnot,
      [KEY_selectedAnnotId]: computed(() => this.selectedAnnotId),
      [KEY_outline]: computed(() => this.outline),
      [KEY_project]: computed(() => this.project),
      [KEY_annots]: computed(() => this.annots),
    };
  },

  async mounted() {
    this.pdfApp = new PDFApplication(
      this.$refs.viewerContainer as HTMLDivElement,
      this.$refs.peekContainer as HTMLDivElement
    );

    this.pdfApp.eventBus.on("pagesinit", () => {
      this.changePageNumber(this.pdfState.currentPageNumber);
      this.changeSpreadMode(this.pdfState.spreadMode);
      this.changeScale({ scale: this.pdfState.currentScale });
      this.pdfState.pagesCount = this.pdfApp.pdfViewer.pagesCount;
      this.ready = true;
    });

    this.pdfApp.eventBus.on(
      "annotationeditorlayerrendered",
      (e: { error: Error | null; pageNumber: number; source: PDFPageView }) => {
        // draw annotations from db
        let annots = this.annots.filter(
          (annot) => annot.pageNumber === e.pageNumber
        );
        for (let annot of annots) this.drawAnnot(annot);

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
          if (
            !clickedAnnotId &&
            this.pdfState.tool === AnnotationType.RECTANGLE
          ) {
            let annotLayer = (this.$refs.viewerContainer as HTMLElement)
              ?.querySelector(
                `div.page[data-page-number='${this.pdfState.currentPageNumber}']`
              )
              ?.querySelector(".annotationEditorLayer") as HTMLElement;
            let layerRect = annotLayer.getBoundingClientRect();
            tempRect = document.createElement("div");
            tempRect.style.position = "absolute";
            tempRect.style.background = this.pdfState.color;
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
            if (!clickedAnnotId) {
              if (this.pdfState.tool === AnnotationType.CURSOR) {
                // toggle menu under text selection
                this.selectionPage = e.pageNumber;
              } else {
                await this.createAnnot(
                  this.pdfState.tool,
                  this.pdfState.color,
                  e.pageNumber,
                  { x1, y1, x2: ev.clientX, y2: ev.clientY }
                );
              }
            }
            e.source.div.onmousemove = null;
            if (tempRect) tempRect.remove();
            // highlight any active annotation (wait until annot layer is ready)
            this.setActiveAnnot(clickedAnnotId as string);
            // toogle annotmenu under annotation / text selection
            this.toggleMenu();
          };
        };
      }
    );

    this.pdfApp.eventBus.on("pagechanging", (e) => {
      this.pdfState.currentPageNumber = e.pageNumber;

      // if the pdf is initially loaded, scroll to last position
      // this line is here because if the scrollto is called too early
      // then the position will be slightly different each time

      (this.$refs.viewerContainer as HTMLElement).scrollTo(
        this.pdfState.scrollLeft,
        this.pdfState.scrollTop
      );
    });

    this.pdfApp.eventBus.on(
      "scalechanging",
      (e: {
        source: PDFPageView;
        scale: number;
        presetValue: string | undefined;
      }) => {
        this.pdfState.currentScale = e.scale;
        if (e.presetValue) this.pdfState.currentScaleValue = e.presetValue;
      }
    );

    // find controller
    this.pdfApp.eventBus.on(
      "updatefindmatchescount",
      (e: {
        source: PDFFindController;
        matchesCount: { current: number; total: number };
      }) => {
        // update the current/total founded during searching
        // this will only fired when something found
        this.matchesCount = e.matchesCount;
      }
    );
    this.pdfApp.eventBus.on(
      "updatetextlayermatches",
      (e: { source: PDFFindController; pageIndex: number }) => {
        // if not found, set the matchesCount.total to 0
        let findController = e.source;
        let selected = findController.selected;
        if (selected === undefined) return;
        if (findController.pageMatches === undefined) return;

        if (selected.matchIdx == -1 && selected.pageIdx == -1) {
          this.matchesCount = { current: -1, total: 0 };
        } else {
          let pageIdx = selected.pageIdx;
          let current = selected.matchIdx + 1;
          for (let i = 0; i < pageIdx; i++) {
            current += findController.pageMatches[i].length;
          }
          this.matchesCount.current = current;
        }
      }
    );

    this.loadPDF(this.projectId);
  },

  watch: {
    project(newProject) {
      this.$bus.emit("updateProject", newProject);
    },

    pdfState: {
      handler(state) {
        if (!this.ready) return;
        this.pdfApp.saveState(state);
      },
      deep: true,
    },

    search: {
      handler(newSearch) {
        if (!this.ready) return;
        this.searchText(newSearch);
      },
      deep: true,
    },

    selectedAnnotId(annotId) {
      this.setActiveAnnot("");
      if (!!!annotId) return;

      // scroll to the selected annot
      let dom = (this.$refs.viewerContainer as HTMLElement).querySelector(
        `section[annotation-id="${annotId}"]`
      );
      if (!!dom) {
        // if the dom is already there, scroll into view
        dom.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
        this.setActiveAnnot(annotId);
      } else {
        // otherwise change the page first
        let annot = this.annots.find(
          (annot) => annot._id === annotId
        ) as Annotation;
        this.changePageNumber(annot.pageNumber);
      }
    },
  },

  methods: {
    async loadPDF(id: string) {
      if (id != this.projectId) return;

      let project = (await getProject(id)) as Project;
      if (project.dataType != "project") return;
      if (!project.path) return; // if no attached file
      // load state before loading pdf
      this.pdfState = await this.pdfApp.loadState(project._id);
      this.annots = (await getAnnotations(this.projectId)) as Annotation[];
      await this.pdfApp.loadPDF(project.path);
      this.outline = await this.pdfApp.getTOC();
      this.pageLabels = await this.pdfApp.getPageLabels();
      this.project = project; // for metainfo tab

      // this.annots = getAnnotations();
    },

    /**********************************
     * PDFApplication - PdfViewer
     **********************************/
    changePageNumber(pageNumber: number) {
      this.pdfApp.changePageNumber(pageNumber);
    },
    changeScale(params: { scaleValue?: string; delta?: number }) {
      this.pdfApp.changeScale(params);
    },
    changeSpreadMode(spreadMode: number) {
      this.pdfApp.changeSpreadMode(spreadMode);
    },
    /**********************************
     * PDFApplication - Find Controller
     **********************************/
    searchText(search: {
      query: string;
      highlightAll?: boolean;
      caseSensitive?: boolean;
      entireWord?: boolean;
    }) {
      this.pdfApp.searchText(search);
    },
    changeMatch(delta: number) {
      this.pdfApp.changeMatch(delta);
    },
    /**********************************
     * PDFApplication - TOC
     **********************************/
    clickTOC(node: TOCNode) {
      this.pdfApp.clickTOC(node);
    },

    /**********************************
     * Annotation
     **********************************/
    setActiveAnnot(annotId: string) {
      this.selectedAnnotId = annotId;

      if (!!annotId) {
        // highlight it
        (this.$refs.viewerContainer as HTMLElement)
          .querySelectorAll(`section[annotation-id="${annotId}"]`)
          .forEach((dom) => {
            dom.classList.add("activeAnnotation");
          });
      } else {
        // deselect annotation
        (this.$refs.viewerContainer as HTMLElement)
          .querySelectorAll(".activeAnnotation")
          .forEach((dom) => {
            dom.classList.remove("activeAnnotation");
          });
      }
    },

    async createAnnot(
      tool: AnnotationType,
      color: string,
      pageNumber: number,
      corner: { x1: number; y1: number; x2: number; y2: number },
      setActive = false
    ) {
      let annot = createAnnotation(
        this.$refs.viewerContainer as HTMLElement,
        pageNumber,
        tool,
        color,
        this.projectId,
        corner
      );

      // update ui
      this.annots.push(annot); // update list
      this.drawAnnot(annot, setActive); // draw it on pdf
      // update db
      await addAnnotation(annot);
    },

    /**
     * Draw annotation on annotationEditorLayer
     * @param annot
     */
    async drawAnnot(annot: Annotation, setActive = false) {
      let doms = drawAnnotation(
        this.$refs.viewerContainer as HTMLElement,
        annot
      );

      // click to highlight annotation
      for (let [i, dom] of doms.entries()) {
        dom.onclick = () => {
          this.setActiveAnnot(dom.getAttribute("annotation-id") as string);
        };
      }

      // enable dragging for annotation
      if (
        annot.type === AnnotationType.COMMENT ||
        annot.type === AnnotationType.RECTANGLE
      ) {
        enableDragToMove(doms[0]);
      }

      // if we should set this annot to active after draw
      if (setActive) {
        this.setActiveAnnot(doms[0].getAttribute("annotation-id") as string);
        this.toggleMenu();
      }
    },

    async updateAnnot(params: { id: string; data: any }) {
      let id = params.id;
      let data = params.data;
      if (id === undefined || data === undefined) return;

      // update db
      let annot = (await updateAnnotation(
        params.id,
        params.data
      )) as Annotation;

      // update PDFReader UI
      if ("color" in data) {
        document
          .querySelectorAll(`section[annotation-id="${id}"]`)
          .forEach((dom) => {
            (dom as HTMLElement).style.background = data.color;
          });
      }
      // update AnnotationList UI
      for (let i in this.annots) {
        if (this.annots[i]._id == annot._id) {
          this.annots[i] = annot;
        }
      }
    },

    async deleteAnnot(id: string) {
      // update db
      await deleteAnnotation(id);

      // close any annot menu
      this.showAnnotCard = false;
      // update PDFReader UI
      document
        .querySelectorAll(`section[annotation-id="${id}"]`)
        .forEach((dom) => {
          dom.remove();
        });
      // update AnnotationList UI
      this.annots = this.annots.filter((annot) => annot._id != id);
    },

    /*******************************
     * AnnotCard & ColorPicker
     *******************************/
    async toggleMenu() {
      // close all menus first
      this.showAnnotCard = false;
      this.showColorPicker = false;
      await this.$nextTick();

      let hasSelection = false;
      let selection = window.getSelection();
      if (selection === null) return;
      let selectionRects: DOMRectList;
      if (!!selection.focusNode) {
        selectionRects = selection.getRangeAt(0).getClientRects();
        if (selectionRects.length > 1) {
          hasSelection = true;
        } else if (selectionRects.length == 1 && selectionRects[0].width > 1) {
          hasSelection = true;
        } else {
          hasSelection = false;
        }
      }

      if (!!this.selectedAnnotId) {
        // show annot card
        let doms = document.querySelectorAll(
          `section[annotation-id="${this.selectedAnnotId}"]`
        );
        let rects = [] as DOMRect[];
        for (let dom of doms) rects.push(dom.getBoundingClientRect());
        this.showAnnotCard = true;
        this.setStyle(rects);
      } else if (hasSelection) {
        // if user has selection, show colorpicker
        this.showColorPicker = true;
        this.setStyle(selectionRects);
      }
    },

    setStyle(rects: DOMRect[] | DOMRectList) {
      let bgRect = (this.$refs.viewer as HTMLElement).getBoundingClientRect();
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

      this.style = `
      background: var(--color-pdfreader-colorpicker-bkgd);
      position: absolute;
      left: ${mid - bgRect.left - 75}px;
      top: ${top - bgRect.top + 10}px;
      min-width: 150px;
      `;
    },

    /**********************************
     * RightMenu
     **********************************/
    toggleRightMenu(visible: boolean) {
      if (visible) {
        this.rightMenuSize = this.prvRightMenuSize;
      } else {
        // record the rightmenu size for next use
        this.prvRightMenuSize = this.rightMenuSize;
        this.rightMenuSize = 0;
      }
    },
  },
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
  // for pdfjs-dist ~ 3.1
  z-index: unset;
}

.activeAnnotation {
  outline-offset: 3px;
  outline: dashed 2px $primary;
}
</style>
