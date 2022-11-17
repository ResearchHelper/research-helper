<template>
  <!-- systembar height : 32px -->
  <q-splitter
    style="height: calc(100vh - 32px)"
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
      <q-splitter
        v-model="stateStore.infoPaneSize"
        reverse
      >
        <template v-slot:before>
          <!-- toolBar -->
          <PDFToolBar
            :pdfState="pdfState"
            @changePageNumber="changePageNumber"
            @changeScale="changeScale"
            @changeScaleValue="changeScaleValue"
            @changeSpreadMode="changeSpreadMode"
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
              :ripple="false"
              @click="clickMenu({ option: 'deleteAnnot' })"
            >
            </q-btn>
          </div>
        </template>
        <template v-slot:after>
          <InfoPane ref="infoPane" />
        </template>
      </q-splitter>
    </template>
  </q-splitter>
</template>

<script>
import LeftMenu from "./LeftMenu.vue";
import PDFToolBar from "./PDFToolBar.vue";
import InfoPane from "../InfoPane.vue";

import { useStateStore } from "src/stores/appState";
import { AnnotationManager, AnnotationType } from "src/annotation";

import * as pdfjsLib from "pdfjs-dist/build/pdf";
import * as pdfjsViewer from "pdfjs-dist/web/pdf_viewer";
pdfjsLib.GlobalWorkerOptions.workerSrc = "pdfjs-dist/build/pdf.worker.min.js";

export default {
  components: { PDFToolBar, LeftMenu, InfoPane },

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
    eventBus.on("pagesinit", () => {
      console.log("document ready");
      this.pagesInit = true;
      // load previous pdf state
      this.loadPDFState();

      // scroll event and ctrl+scroll (zoom) event
      container.addEventListener("scroll", (e) => this.handleScroll(e));
      container.addEventListener("mousewheel", (e) => this.handleCtrlScroll(e));

      // annotation manager
      this.annotManager = new AnnotationManager(this.pdfViewer);
    });

    eventBus.on("annotationeditorlayerrendered", (e) => {
      this.annotManager.drawAnnotations(e.pageNumber);
      this.annotManager.bindFunc2Doms(e.pageNumber, this.clickAnnotation);

      e.source.div.onmouseup = (ev) => {
        let rect = null;
        let pdfState = this.pdfState; // save to local var to decrease fetch freq
        if (pdfState.tool == AnnotationType.COMMENT)
          rect = { left: ev.clientX, top: ev.clientY, width: 5, height: 5 };
        let dom = this.annotManager.createAnnotation({
          type: pdfState.tool,
          rect: rect, // only for comment annotation
          color: pdfState.color,
          pageNumber: e.pageNumber,
        });

        if (!!dom) {
          // bind function to dom
          let tool = pdfState.tool;
          dom.onclick = () => this.clickAnnotation(dom);
          // FIXME: this doesn't work for annotations from database
          dom.onmouseover = () => this.changeTool("cursor");
          dom.onmouseleave = () => this.changeTool(tool);
          dom.click();
        }

        // if mouse clicks outside of the menu, close it
        let menu = document.getElementById("menu");
        if (!menu.contains(e.target)) menu.hidden = true;
      };
    });

    // find controller
    eventBus.on("updatefindmatchescount", (e) => {
      // update the total founded during searching
      this.pdfState = { matchesCount: e.matchesCount };
    });
    eventBus.on("updatetextlayermatches", (e) => {
      // update the current / total during navigating between matches
      let pdfState = this.pdfState;
      if (!!pdfState.matchesCount) {
        let findController = e.source;
        let pageIdx = findController.selected.pageIdx;
        let current = findController.selected.matchIdx + 1;
        for (let i = 0; i < pageIdx; i++) {
          current += findController.pageMatches[i].length;
        }
        pdfState.matchesCount.current = current;
        this.pdfState = { matchesCount: pdfState.matchesCount };
      }
    });
  },

  watch: {
    "stateStore.workingProject"(project) {
      this.pagesInit = false;
      console.log("loading:", project.path);
      this.loadPDF(project.path);
    },

    "stateStore.pdfStates": {
      handler(newState, oldState) {
        if (this.pagesInit) this.stateStore.savePDFStates();
      },
      deep: true,
    },

    "stateStore.selectedAnnotId"(newId, oldId) {
      let newAnnot = document.getElementById(newId);
      let oldAnnot = document.getElementById(oldId);

      // change active annotation and annotation card
      if (!!oldAnnot) oldAnnot.classList.remove("activeAnnotation");
      newAnnot.classList.add("activeAnnotation");

      // FIXME: shouldn't use scrollIntoView since some pages are not rendered
      console.log(newAnnot);
      // this.changePageNumber(annotManager.);
      // newAnnot.scrollIntoView({
      //   behavior: "smooth",
      //   block: "nearest",
      //   inline: "nearest",
      // });
    },
  },

  data() {
    return {
      pdfDocument: null,

      selectedAnnotation: null,
      showCommentEditor: false,
    };
  },

  computed: {
    pdfState: {
      get() {
        return this.stateStore.getPDFState();
      },

      set(properties) {
        this.stateStore.setPDFState(properties);
      },
    },
  },

  methods: {
    loadPDF(PDFRelativePath) {
      let loadingTask = pdfjsLib.getDocument({
        url: "http://localhost:5000/" + PDFRelativePath,
      });
      loadingTask.promise.then((pdfDocument) => {
        this.pdfLinkService.setDocument(pdfDocument, null);
        this.pdfViewer.setDocument(pdfDocument);

        // for table of content
        this.pdfDocument = pdfDocument;
      });
    },

    loadPDFState() {
      this.stateStore.loadPDFState();
      let pdfState = this.pdfState;
      this.pdfState = { pagesCount: this.pdfViewer.pagesCount };

      this.changePageNumber(pdfState.currentPageNumber);
      this.setScale(pdfState.currentScale);
      if (!!pdfState.currentScaleValue)
        this.changeScaleValue(pdfState.currentScaleValue);
      this.changeSpreadMode(pdfState.spreadMode);
      this.changeTool(pdfState.tool);
      this.changeColor(pdfState.color);
    },

    handleScroll(e) {
      // update pdfState
      this.stateStore.setPDFState({
        currentPageNumber: this.pdfViewer.currentPageNumber,
      });
    },

    handleCtrlScroll(e) {
      if (e.ctrlKey === true) {
        // this is not scrolling, so we need to
        // disable the default action avoid the offsetParent not set error
        e.preventDefault();
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

        this.pdfState = {
          currentScale: this.pdfViewer.currentScale,
        };
      }
    },

    // tool bar
    changePageNumber(pageNumber) {
      pageNumber = parseInt(pageNumber);
      this.pdfViewer.currentPageNumber = pageNumber;
      this.pdfState = { currentPageNumber: pageNumber };
    },

    setScale(scale) {
      this.pdfViewer.currentScale = parseFloat(scale);
      this.pdfState = {
        currentScale: this.pdfViewer.currentScale,
      };
    },

    changeScale(scale) {
      this.pdfViewer.currentScale += scale;
      this.pdfState = {
        currentScale: this.pdfViewer.currentScale,
      };
    },

    changeScaleValue(scaleValue) {
      this.pdfViewer.currentScaleValue = scaleValue;
      this.pdfState = {
        currentScaleValue: this.pdfViewer.currentScaleValue,
        currentScale: this.pdfViewer.currentScale,
      };
    },

    changeSpreadMode(spreadMode) {
      this.pdfViewer.spreadMode = parseInt(spreadMode);
      this.pdfState = {
        spreadMode: this.pdfViewer.spreadMode,
      };
    },

    changeTool(tool) {
      this.pdfState = {
        tool: tool,
      };
    },

    changeColor(color) {
      this.pdfState = {
        color: color,
      };
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
        } else if (pageIdx > this.pdfState.pagesCount - 1) {
          pageIdx = this.pdfState.pagesCount - 1;
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
      if (dom.className == "highlightAnnotation") {
        let menu = document.getElementById("menu");
        menu.hidden = false;
        menu.style.position = "absolute";
        menu.style.left =
          parseFloat(dom.style.left) + parseFloat(dom.style.width) + 2 + "%";
        menu.style.top = dom.style.top;
        // menu moves to annotationLayer, we need to make it clickable
        menu.style.pointerEvents = "auto";
        // move the menu to the same level as the dom
        // so that the percentage can work properly
        dom.parentNode.appendChild(menu);

        // set this so the menu can recognize the annotation
        this.selectedAnnotation = dom;
      } else if (dom.className == "textAnnotation") {
        // we want to open annotation list and edit it
        if (this.stateStore.infoPaneSize == 0) this.stateStore.toggleInfoPane();
        this.stateStore.setInfoPaneTab("annotationTab");
        this.stateStore.selectedAnnotId = dom.id;
      }
    },

    clickMenu(params) {
      let id = this.selectedAnnotation.id;
      switch (params.option) {
        case "changeColor":
          this.annotManager.modifyAnnotation(id, { color: params.color });
          break;
        case "deleteAnnot":
          this.annotManager.deleteAnnotation(id);
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
</style>
