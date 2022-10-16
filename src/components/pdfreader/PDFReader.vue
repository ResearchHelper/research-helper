<template>
  <q-splitter
    v-model="stateStore.leftMenuSize"
    :limits="[0, 30]"
  >
    <template v-slot:before>
      <LeftMenu
        :pdfDocument="pdfDocument"
        @changePageNumber="changePageNumber"
      />
    </template>
    <template v-slot:after>
      <!-- toolBar -->
      <PDFToolBar
        :pdfState="pdfState"
        @changePageNumber="changePageNumber"
        @changeScale="changeScale"
        @changeScaleValue="changeScaleValue"
        @changeTool="changeTool"
        @searchText="searchText"
        @changeMatch="changeMatch"
        @changeColor="changeColor"
      />
      <!-- Viewer -->
      <div id="viewerContainer">
        <div
          id="viewer"
          class="pdfViewer"
        ></div>
      </div>
      <!-- Annotation Menu -->
      <div
        id="menu"
        :hidden="true"
        style="background: #1d1d1d"
      >
        <q-color
          no-header
          no-footer
          bordered
          default-view="palette"
          :palette="[
            '#FFFF00',
            '#019A9D',
            '#D9B801',
            '#E8045A',
            '#B2028A',
            '#2A0449',
          ]"
          @change="
            (color) =>
              clickMenu({
                option: 'changeColor',
                color: color,
              })
          "
        />
        <q-btn
          square
          icon="delete"
          size="sm"
        >
        </q-btn>
        <!-- <q-item
            clickable
            @click="clickMenu({ option: 'deleteAnnot' })"
          >
            Delete Annotation
          </q-item> -->
      </div>
    </template>
  </q-splitter>
</template>

<script>
import PDFToolBar from "./PDFToolBar.vue";

import { useStateStore } from "src/stores/appState";

import { Annotation, AnnotationType } from "src/annotation";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import * as pdfjsViewer from "pdfjs-dist/web/pdf_viewer";
import LeftMenu from "./LeftMenu.vue";
pdfjsLib.GlobalWorkerOptions.workerSrc = "pdfjs-dist/build/pdf.worker.js";

export default {
  components: { PDFToolBar, LeftMenu },

  data() {
    return {
      showMenu: false,
      menuOffset: null,
    };
  },

  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  mounted() {
    let container = document.getElementById("viewerContainer");
    let eventBus = new pdfjsViewer.EventBus();
    // (Optionally) enable hyperlinks within PDF files.
    const pdfLinkService = new pdfjsViewer.PDFLinkService({
      eventBus,
    });
    const pdfFindController = new pdfjsViewer.PDFFindController({
      eventBus,
      linkService: pdfLinkService,
    });

    const pdfViewer = new pdfjsViewer.PDFViewer({
      container,
      eventBus,
      linkService: pdfLinkService,
      findController: pdfFindController,
      annotationEditorMode: pdfjsLib.AnnotationEditorType.NONE,
    });
    pdfLinkService.setViewer(pdfViewer);

    this.pdfViewer = pdfViewer;
    this.pdfLinkService = pdfLinkService;

    this.loadPDF(this.stateStore.workingProject.path);
    eventBus.on("pagesloaded", () => {
      // load previous pdf state
      this.loadPDFState(this.stateStore.workingProject.path);

      // scroll event and ctrl+scroll (zoom) event
      document.addEventListener("mousewheel", (e) => this.handleScroll(e));

      // for annotations
      this.annotation = new Annotation(this.pdfViewer);

      // create annotations
      for (let dom of this.annotation.doms) {
        dom.onclick = () => this.clickAnnotation(dom);
      }
      container.onmouseup = (e) => {
        let rect = null;
        if (this.pdfState.tool == AnnotationType.COMMENT)
          rect = { left: e.clientX, top: e.clientY, width: 5, height: 5 };
        let dom = this.annotation.createAnnotation({
          type: this.pdfState.tool,
          rect: rect, // only for comment annotation
          color: this.pdfState.color,
        });
        if (!!dom) dom.onclick = () => this.clickAnnotation(dom);

        // if the mouse is clicking somewhere else than menu, close it
        let menu = document.getElementById("menu");
        if (!menu.contains(e.target)) menu.hidden = true;
      };
    });

    // find controller
    eventBus.on("updatefindmatchescount", (e) => {
      // update the total founded during searching
      this.pdfState.matchesCount = e.matchesCount;
      console.log("writing pdfState", this.pdfState.matchesCount);
    });
    eventBus.on("updatetextlayermatches", (e) => {
      // update the current / total during navigating between matches
      if (!!this.pdfState.matchesCount) {
        let findController = e.source;
        let pageIdx = findController.selected.pageIdx;
        let current = findController.selected.matchIdx + 1;
        for (let i = 0; i < pageIdx; i++) {
          current += findController.pageMatches[i].length;
        }
        this.pdfState.matchesCount.current = current;
      }
    });
  },

  watch: {
    "stateStore.workingProject"(project) {
      console.log("loading:", project.path);
      this.loadPDF(project.path);
    },
  },

  data() {
    return {
      selectedAnnotation: null,

      pdfDocument: null,

      pdfState: {
        numPages: 1,
        currentPageNumber: 1,
        currentScale: 1,
        tool: AnnotationType.NONE,
        color: "#FFFF00",
      },
    };
  },

  methods: {
    loadPDF(PDFRelativePath) {
      let loadingTask = pdfjsLib.getDocument({
        url: "http://localhost:5000/" + PDFRelativePath,
      });
      loadingTask.promise.then((pdfDocument) => {
        this.pdfLinkService.setDocument(pdfDocument, null);
        this.pdfViewer.setDocument(pdfDocument);
        // total pages of the pdf
        this.pdfState.numPages = pdfDocument.numPages;

        this.pdfDocument = pdfDocument;
      });
    },

    loadPDFState(PDFRelativePath) {
      this.changePageNumber(1);
      this.changeScale(1);
      this.changeScaleValue("page-width");
      this.changeTool("cursor");
    },

    handleScroll(e) {
      if (e.ctrlKey === true) {
        if (e.deltaY < 0) {
          let oldScale = this.pdfViewer.currentScale;
          this.pdfViewer.currentScale += 0.1;
          let newScale = this.pdfViewer.currentScale;
          let container = document.getElementById("viewerContainer");
          let oldX = container.scrollLeft + e.pageX;
          let oldY = container.scrollTop + e.pageY;

          // shift the scroll bar if cursor if too far from center
          if (e.pageX > window.innerWidth * (7 / 10))
            container.scrollLeft += (newScale / oldScale - 1) * oldX;
          else if (e.pageX < window.innerWidth * (3 / 10))
            container.scrollLeft -= (newScale / oldScale - 1) * oldX;
          if (e.pageY > window.innerHeight * (7 / 10))
            container.scrollTop += (newScale / oldScale - 1) * oldY;
          else if (e.pageY < window.innerHeight * (3 / 10))
            container.scrollTop -= (newScale / oldScale - 1) * oldY;
        } else {
          this.pdfViewer.currentScale -= 0.1;
        }
      }

      // update pdfState
      this.pdfState.currentPageNumber = this.pdfViewer.currentPageNumber;
      this.pdfState.currentScale = this.pdfViewer.currentScale;
    },

    // tool bar
    changePageNumber(pageNumber) {
      console.log(pageNumber);
      pageNumber = parseInt(pageNumber);
      this.pdfViewer.currentPageNumber = pageNumber;
      this.pdfState.currentPageNumber = pageNumber;
    },

    changeScale(scale) {
      this.pdfViewer.currentScale += scale;
      this.pdfState.currentScale = this.pdfViewer.currentScale;
    },

    changeScaleValue(scaleValue) {
      this.pdfViewer.currentScaleValue = scaleValue;
      this.pdfState.currentScaleValue = this.pdfViewer.currentScaleValue;
      this.pdfState.currentScale = this.pdfViewer.currentScale;
    },

    changeTool(tool) {
      this.pdfState.tool = tool;
    },

    changeColor(color) {
      this.pdfState.color = color;
    },

    searchText(text) {
      // this will move the next nearest match
      this.pdfViewer.eventBus.dispatch("find", {
        caseSensitive: false,
        findPrevious: undefined,
        highlightAll: true,
        phraseSearch: true,
        query: text,
      });
    },

    changeMatch(delta) {
      // TODO: improve this, bound the search within page number
      // delta can only be +1 (next) or -1 (prev)
      let findController = this.pdfViewer.findController;

      let currentMatch = findController.selected;
      let pageIdx = currentMatch.pageIdx;
      let newMatchIdx = currentMatch.matchIdx + delta;

      let matches = findController.pageMatches;
      let matchIdxList = matches[pageIdx];

      while (newMatchIdx < 0 || newMatchIdx > matchIdxList.length - 1) {
        pageIdx += delta;
        if (pageIdx < 0) {
          pageIdx = 0;
          break;
        } else if (pageIdx > this.pdfState.numPages - 1) {
          pageIdx = this.pdfState.numPages - 1;
          break;
        }
        // if next: select first match (delta-1 = 0) in the next available pages
        // if prev: select last match (length-1) in the previous available pages
        console.log(pageIdx);
        matchIdxList = matches[pageIdx];
        newMatchIdx = delta > 0 ? 0 : matchIdxList.length - 1;
      }

      if (newMatchIdx < 0) newMatchIdx = 0;
      if (newMatchIdx > matchIdxList.length)
        newMatchIdx = matchIdxList.length - 1;

      console.log(`pageIdx=${pageIdx}, matchIdx=${newMatchIdx}`);

      this.pdfViewer.findController.selected.pageIdx = pageIdx;
      this.pdfViewer.findController.selected.matchIdx = newMatchIdx;
      this.changePageNumber(pageIdx + 1);
      this.pdfViewer.eventBus.dispatch("updatetextlayermatches", {
        source: findController,
        pageIndex: pageIdx,
      });
    },

    clickAnnotation(dom) {
      let menu = document.getElementById("menu");
      menu.style.position = "absolute";
      menu.style.left =
        parseFloat(dom.style.left) + parseFloat(dom.style.width) + "%";
      menu.style.top = dom.style.top;
      menu.hidden = false;

      this.selectedAnnotation = dom;
    },

    clickMenu(params) {
      let id = this.selectedAnnotation.id;
      switch (params.option) {
        case "changeColor":
          this.annotation.modifyAnnotation(id, { color: params.color });
          break;
        case "deleteAnnot":
          this.annotation.deleteAnnotation(id);
          break;
      }

      // close menu
      document.getElementById("menu").hidden = true;
    },
  },
};
</script>

<style lang="scss">
@import "pdfjs-dist/web/pdf_viewer.css";
#viewerContainer {
  position: absolute;
  overflow: auto;
  height: 97%; // this and toolBar adds up to 100%
  width: 100%;
  margin-right: 10px;
}
// Fix the text color in note
.popup {
  color: black;
}

// active annotation
.activeAnnotation {
  border: solid cyan;
}
</style>
