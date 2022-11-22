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
        :limits="[0, 60]"
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

          <!-- Peek Viewer -->
          <div
            style="display: none"
            id="peekContainer"
          >
            <div
              id="peakViewer"
              class="pdfViewer singlePageView"
            ></div>
          </div>
          <!-- Annotation Menu -->
          <q-card
            id="menu"
            hidden="true"
            style="max-width: fit-content"
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
            <q-card-actions
              align="around"
              class="q-pa-none"
            >
              <q-btn
                flat
                icon="delete"
                size="sm"
                :ripple="false"
                @click="clickMenu({ option: 'deleteAnnot' })"
              >
              </q-btn>
              <q-btn
                flat
                icon="comment"
                size="sm"
                :ripple="false"
              >
              </q-btn>
            </q-card-actions>
          </q-card>
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
import { useAnnotStore } from "src/stores/annotStore";
import { PeekManager } from "src/api/pdfpeek";
import { AnnotationType } from "src/api/annotation";

// The pdfjs-dist is on public
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import * as pdfjsViewer from "pdfjs-dist/web/pdf_viewer";
pdfjsLib.GlobalWorkerOptions.workerSrc = "pdfjs-dist/build/pdf.worker.min.js";

export default {
  components: { PDFToolBar, LeftMenu, InfoPane },

  setup() {
    const stateStore = useStateStore();
    const annotStore = useAnnotStore();
    annotStore.init(stateStore.workingProject.projectId);
    return { stateStore, annotStore };
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

    this.loadPDF();
    eventBus.on("pagesinit", () => {
      console.log("document ready");
      this.pagesInit = true;
      // load previous pdf state
      this.loadPDFState();

      // scroll event and ctrl+scroll (zoom) event
      container.addEventListener("scroll", (e) => this.handleScroll(e));
      container.addEventListener("mousewheel", (e) => this.handleCtrlScroll(e));
    });

    eventBus.on("annotationeditorlayerrendered", (e) => {
      // peek hyperlinks
      let links = document.querySelectorAll("a.internalLink");
      for (let link of links) this.peekManager.peak(link);

      // draw annotations from db
      let annots = this.annotStore.getAnnotsByPage(e.pageNumber);
      for (let annot of annots) {
        this.annotStore.create(annot, true).then((doms) => {
          // bind function to dom
          for (let dom of doms) dom.onclick = () => this.clickAnnotation(dom);
        });
      }

      // draw annotations when mouse is up
      e.source.div.onmouseup = (ev) => {
        let rect = null;
        let pdfState = this.pdfState; // save to local var to decrease fetch freq
        if (pdfState.tool == AnnotationType.COMMENT)
          rect = { left: ev.clientX, top: ev.clientY, width: 44, height: 44 };
        this.annotStore
          .create({
            type: pdfState.tool,
            rect: rect, // only for comment annotation
            color: pdfState.color,
            pageNumber: e.pageNumber,
          })
          .then((doms) => {
            // bind function to dom
            for (let dom of doms) {
              dom.onclick = () => this.clickAnnotation(dom);
              if (pdfState.tool == AnnotationType.COMMENT) {
                dom.click(); // open the annotation list
                this.changeTool("cursor"); // prevent adding note ontop of note
              }
            }
          });

        // if mouse clicks outside of the menu, close it
        // and deselect the annotation
        let menu = document.getElementById("menu");
        if (!menu.contains(ev.target)) {
          menu.hidden = true;
          this.annotStore.select(null);
        }
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
      this.loadPDF();
    },

    "stateStore.pdfStates": {
      handler(newState, oldState) {
        if (this.pagesInit) this.stateStore.savePDFStates();
      },
      deep: true,
    },

    "annotStore.selectedAnnotId"(newId, oldId) {
      // if we select an annotation in a page not yet rendered
      // turn to that page
      if (!!newId) {
        this.annotStore.getAnnotById(newId).then((annot) => {
          console.log(annot);
          if (annot.pageNumber != this.pdfState.pageNumber) {
            this.changePageNumber(annot.pageNumber);
            setTimeout(() => {
              // wait until the page rendered then make the annot active
              this.annotStore.select(newId);
            }, 200);
          }
        });
      }
    },
  },

  data() {
    return {
      pdfDocument: null,
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
    loadPDF() {
      let path = window.path.join(
        this.stateStore.storagePath,
        this.stateStore.workingProject.path
      );
      let buffer = window.fs.readFileSync(path);
      let loadingTask = pdfjsLib.getDocument({
        data: buffer,
      });
      loadingTask.promise.then((pdfDocument) => {
        this.pdfLinkService.setDocument(pdfDocument, null);
        this.pdfViewer.setDocument(pdfDocument);

        // for table of content
        this.pdfDocument = pdfDocument;
      });
      this.peekManager = new PeekManager(path);
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
      if (dom.classList.contains("highlightAnnotation")) {
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
      }
      // open info pane
      if (this.stateStore.infoPaneSize == 0) this.stateStore.toggleInfoPane();
      this.stateStore.setInfoPaneTab("annotationTab");
      this.annotStore.select(dom.getAttribute("annotation-id"));
    },

    clickMenu(params) {
      let id = this.annotStore.selectedAnnotId;
      console.log("clickMenu", id);
      switch (params.option) {
        case "changeColor":
          this.annotStore.update(id, { color: params.color });
          break;
        case "deleteAnnot":
          this.annotStore.delete(id);
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

#peekContainer {
  position: absolute;
  overflow: auto;
  background: grey;
  border: solid black 5px;
  border-radius: 5px;
}

.pdfViewer.singlePageView .page {
  // fix the empty space on the right
  border: unset !important;
}

.activeAnnotation {
  border: dashed 2px cyan;
}
</style>
