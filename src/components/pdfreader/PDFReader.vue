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
          :annotId="selectedAnnotId"
          @close="showAnnotCard = false"
          @update="(params) => updateAnnot(params)"
          @delete="(params) => deleteAnnot(params)"
        />

        <div
          v-if="showColorPicker"
          :style="style"
          class="q-px-sm q-py-xs"
        >
          <ColorPicker
            @selected="
              (color) =>
                createAnnot({
                  pageNumber: selectionPage,
                  left: null,
                  top: null,
                  tool: 'highlight',
                  color: color,
                })
            "
          />
        </div>
      </div>
      <div
        ref="peekContainer"
        class="peekContainer"
      >
        <div
          ref="peakViewer"
          class="pdfViewer"
        ></div>
      </div>
    </template>
    <template v-slot:after>
      <q-tabs
        v-model="rightMenuTab"
        dense
        align="justify"
        style="background: var(--color-rightmenu-tabs-bkgd)"
        indicator-color="transparent"
        active-color="primary"
      >
        <q-tab
          name="metaInfoTab"
          icon="info"
          :ripple="false"
        />
        <q-tab
          name="tocTab"
          icon="toc"
          :ripple="false"
        />
        <q-tab
          name="annotationTab"
          icon="edit"
          :ripple="false"
        />
      </q-tabs>
      <!-- q-tab height: 36px -->
      <q-tab-panels
        style="
          height: calc(100% - 36px);
          background: var(--color-rightmenu-tab-panel-bkgd);
        "
        v-model="rightMenuTab"
      >
        <q-tab-panel name="metaInfoTab">
          <MetaInfoTab
            v-if="!!rightMenuSize"
            :project-id="projectId"
          />
        </q-tab-panel>

        <q-tab-panel name="tocTab">
          <PDFTOC
            :outline="outline"
            @clickTOC="(node) => clickTOC(node)"
          />
        </q-tab-panel>

        <q-tab-panel name="annotationTab">
          <AnnotationList
            ref="annotList"
            v-model:selectedAnnotId="selectedAnnotId"
            :annots="annots"
            @update="updateAnnot"
            @delete="deleteAnnot"
          />
        </q-tab-panel>
      </q-tab-panels>
    </template>
  </q-splitter>
</template>

<script>
import PDFToolBar from "./PDFToolBar.vue";
import MetaInfoTab from "../MetaInfoTab.vue";
import PDFTOC from "./PDFTOC.vue";
import AnnotationList from "./AnnotationList.vue";
import AnnotCard from "./AnnotCard.vue";
import ColorPicker from "./ColorPicker.vue";

import { PDFApplication } from "src/backend/pdfreader/pdfreader";
import { useStateStore } from "src/stores/appState";
import { getProject } from "src/backend/project/project";
import { AnnotManager } from "src/backend/pdfreader/annotManager";

export default {
  props: { projectId: String },

  components: {
    PDFToolBar,
    MetaInfoTab,
    PDFTOC,
    AnnotationList,
    AnnotCard,
    ColorPicker,
  },

  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  data() {
    return {
      ready: false,

      // right menu
      prvRightMenuSize: 25,
      rightMenuSize: 0,
      rightMenuTab: "metaInfoTab",

      // pdf related
      pdfState: {},
      matchesCount: { current: -1, total: 0 },
      outline: [],
      annots: [],
      selectedAnnotId: "",

      // annot card & colorpicker
      showAnnotCard: false,
      showColorPicker: false,
      selectionPage: 0,
      style: "",
    };
  },

  async mounted() {
    await this.$nextTick();
    this.pdfApp = new PDFApplication(
      this.$refs.viewerContainer,
      this.$refs.peekContainer
    );
    this.annotManager = new AnnotManager(
      this.projectId,
      this.$refs.viewerContainer
    );

    this.pdfApp.eventBus.on("pagesinit", (e) => {
      this.changePageNumber(this.pdfState.currentPageNumber);
      this.changeSpreadMode(this.pdfState.spreadMode);
      this.changeScale({ scale: this.pdfState.currentScale });
      this.pdfState.pagesCount = this.pdfApp.pdfViewer.pagesCount;
      this.$refs.viewerContainer.scrollTo(
        this.pdfState.scrollLeft,
        this.pdfState.scrollTop
      );
      this.ready = true;
    });

    this.pdfApp.eventBus.on("annotationeditorlayerrendered", (e) => {
      // draw annotations from db
      this.annotManager.drawAnnots(e.pageNumber);

      // draw annotations when mouse is up
      e.source.div.onmouseup = async (ev) =>
        await this.createAnnot({
          pageNumber: e.pageNumber,
          left: ev.clientX,
          top: ev.clientY,
          tool: this.pdfState.tool,
          color: this.pdfState.color,
        });

      // highlight any active annotation (wait until annot layer is ready)
      this.annotManager.setActiveAnnot(this.selectedAnnotId);
    });

    this.pdfApp.eventBus.on("pagechanging", (e) => {
      this.pdfState.currentPageNumber = e.pageNumber;
    });

    this.pdfApp.eventBus.on("scalechanging", (e) => {
      this.pdfState.currentScale = e.scale;
      this.pdfState.currentScaleValue = e.presetValue;
    });

    // find controller
    this.pdfApp.eventBus.on("updatefindmatchescount", (e) => {
      // update the current/total founded during searching
      // this will only fired when something found
      this.matchesCount = e.matchesCount;
    });
    this.pdfApp.eventBus.on("updatetextlayermatches", (e) => {
      // if not found, set the matchesCount.total to 0
      let findController = e.source;
      let selected = findController.selected;
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
    });

    this.loadPDF(this.projectId);
  },

  watch: {
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
      this.annotManager.setActiveAnnot("");
      if (!!!annotId) return;

      // scroll to the selected annot
      let annot = this.annotManager.getAnnotById(annotId);
      let dom = this.$refs.viewerContainer.querySelector(
        `section[annotation-id="${annotId}"]`
      );
      if (!!dom) {
        // if the dom is already there, scroll into view
        dom.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
        this.annotManager.setActiveAnnot(annotId);
      } else {
        // otherwise change the page first
        this.changePageNumber(annot.pageNumber);
      }
    },
  },

  methods: {
    async loadPDF(id) {
      if (id != this.projectId) return;

      let project = await getProject(id);
      if (project.dataType != "project") return;
      if (!project.path) return; // if no attached file
      // load state before loading pdf
      this.pdfState = await this.pdfApp.loadState(project._id);
      await this.annotManager.init();
      this.annots = this.annotManager.annots;
      await this.pdfApp.loadPDF(project.path);
      this.outline = await this.pdfApp.getTOC();
    },

    /**********************************
     * PDFApplication - PdfViewer
     **********************************/
    changePageNumber(pageNumber) {
      this.pdfApp.changePageNumber(pageNumber);
    },
    changeScale(params) {
      this.pdfApp.changeScale(params);
    },
    changeSpreadMode(spreadMode) {
      this.pdfApp.changeSpreadMode(spreadMode);
    },
    /**********************************
     * PDFApplication - Find Controller
     **********************************/
    searchText(search) {
      this.pdfApp.searchText(search);
    },
    changeMatch(delta) {
      this.pdfApp.changeMatch(delta);
    },
    /**********************************
     * PDFApplication - TOC
     **********************************/
    clickTOC(node) {
      this.pdfApp.clickTOC(node);
    },

    /**********************************
     * AnnotManager
     **********************************/
    async createAnnot(annot) {
      await this.annotManager.create(
        annot.pageNumber,
        annot.left,
        annot.top,
        annot.tool,
        annot.color
      );
      if (this.pdfState.tool == "comment") this.pdfState.tool = "cursor";

      setTimeout(() => {
        this.selectedAnnotId = this.annotManager.selected;
        this.selectionPage = annot.pageNumber; // for colorpicker
        this.toggleMenu();
      }, 50);
    },

    async updateAnnot(params) {
      // update db
      await this.annotManager.update(params.id, params.data);

      // update ui
      this.annots = this.annotManager.annots;
      if (!!this.$refs.annotList) this.$refs.annotList.updateList();
    },

    async deleteAnnot(params) {
      await this.annotManager.delete(params.id);
      this.annots = this.annotManager.annots;
      this.showAnnotCard = false;
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
      let rects = [];
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

      if (!!this.selectedAnnotId) {
        // show annot card
        let doms = document.querySelectorAll(
          `section[annotation-id="${this.selectedAnnotId}"]`
        );
        rects = [];
        for (let dom of doms) rects.push(dom.getBoundingClientRect());
        this.showAnnotCard = true;
        this.setStyle(rects);
      } else if (hasSelection) {
        // if user has selection, show colorpicker
        this.showColorPicker = true;
        this.setStyle(rects);
      }
    },

    setStyle(rects) {
      let bgRect = this.$refs.viewer.getBoundingClientRect();

      // unit: px
      let top = 0;
      let mid = 0;
      let n = rects.length;
      for (let rect of rects) {
        top = Math.max(top, rect.bottom);
        mid += (rect.left + rect.right) / 2 / n;
      }

      this.style = `
      background: var(--q-dark-page);
      position: absolute;
      left: ${mid - bgRect.left - 75}px;
      top: ${top - bgRect.top + 10}px;
      min-width: 150px;
      `;
    },

    /**********************************
     * RightMenu
     **********************************/
    toggleRightMenu(visible) {
      if (visible) {
        this.rightMenuSize = this.prvRightMenuSize;
      } else {
        // record the rightmenu size for next use
        this.prvRightMenuSize = this.rightMenuSize;
        this.rightMenuSize = 0;
      }
    },
  },
};
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
  outline: dashed 2px cyan;
}

// .q-splitter__after {
//   // hide the bottom scrollbar in pdf page
//   // overflow: hidden;
// }
</style>
