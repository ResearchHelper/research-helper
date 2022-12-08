<template>
  <q-splitter
    style="height: calc(100vh - 32px)"
    v-model="stateStore.leftMenuSize"
    :limits="[0, 30]"
  >
    <template v-slot:before>
      <LeftMenu @changePageNumber="changePageNumber" />
    </template>
    <template v-slot:after>
      <q-splitter
        v-model="stateStore.infoPaneSize"
        reverse
        :limits="[0, 60]"
      >
        <template v-slot:before>
          <PDFToolBar
            style="position: absolute; top: 0"
            @changePageNumber="changePageNumber"
            @changeScale="changeScale"
            @searchText="searchText"
            @changeMatch="changeMatch"
          />

          <div id="viewerContainer">
            <div
              id="viewer"
              class="pdfViewer"
            ></div>
          </div>
          <div id="peekContainer">
            <div
              id="peakViewer"
              class="pdfViewer"
            ></div>
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
import PDFToolBar from "./PDFToolBar.vue";
import LeftMenu from "./LeftMenu.vue";
import InfoPane from "../InfoPane.vue";

import { PDFApplication, AnnotationType } from "src/api/pdfreader/pdfreader";
import { usePDFStateStore } from "src/stores/pdfState";
import { useStateStore } from "src/stores/appState";
import { useAnnotStore } from "src/stores/annotStore";
import { useProjectStore } from "src/stores/projectStore";

export default {
  components: { PDFToolBar, LeftMenu, InfoPane },

  setup() {
    const stateStore = useStateStore();
    const annotStore = useAnnotStore();
    const pdfState = usePDFStateStore();
    const projectStore = useProjectStore();
    return { stateStore, annotStore, pdfState, projectStore };
  },

  data() {
    return {
      ready: false,
    };
  },

  async mounted() {
    let project = this.projectStore.workingProject;
    await this.pdfState.getPDFState(project._id);
    await this.annotStore.init(project._id);

    this.pdfApp = new PDFApplication();
    this.pdfApp.loadPDF(project.path);
    this.pdfState.outline = await this.pdfApp.getTOC();

    // reactive events
    this.pdfApp.eventBus.on("pagesinit", (e) => {
      // set pdf state when pages inited
      this.changePageNumber(this.pdfState.currentPageNumber);
      this.changeSpreadMode(this.pdfState.spreadMode);
      this.changeScale({ scaleValue: this.pdfState.currentScaleValue });

      if (this.pdfState.pagesCount == 0) {
        this.pdfState.pagesCount = this.pdfApp.pdfViewer.pagesCount;
      }
      this.ready = true;
    });

    this.pdfApp.eventBus.on("annotationeditorlayerrendered", (e) => {
      // draw annotations from db
      this.drawAnnotations(e.pageNumber);

      // draw annotations when mouse is up
      e.source.div.onmouseup = (ev) => this.createAnnotation(e.pageNumber, ev);

      // highlight any active annotation (wait until annot layer is ready)
      this.setActiveAnnotation(this.annotStore.selectedAnnotId);
    });

    this.pdfApp.eventBus.on("pagechanging", (e) => {
      this.pdfState.currentPageNumber = e.pageNumber;
    });

    // find controller
    this.pdfApp.eventBus.on("updatefindmatchescount", (e) => {
      // update the current/total founded during searching
      // this will only fired when something found
      this.pdfState.matchesCount = e.matchesCount;
    });
    this.pdfApp.eventBus.on("updatetextlayermatches", (e) => {
      // if not found, set the matchesCount.total to 0
      let findController = e.source;
      let selected = findController.selected;
      if (selected.matchIdx == -1 && selected.pageIdx == -1) {
        this.pdfState.matchesCount = { current: -1, total: 0 };
      } else {
        let pageIdx = selected.pageIdx;
        let current = selected.matchIdx + 1;
        for (let i = 0; i < pageIdx; i++) {
          current += findController.pageMatches[i].length;
        }
        this.pdfState.matchesCount.current = current;
      }
    });
  },

  watch: {
    "projectStore.workingProject": {
      async handler(project, _) {
        if (this.ready) {
          this.ready = false; // don't save things until the document is loaded
          await this.pdfState.getPDFState(project._id);
          await this.annotStore.init(project._id);
          this.pdfState.outline = await this.pdfApp.getTOC();
          this.pdfApp.loadPDF(project.path);
        }
      },
      deep: true,
    },

    "pdfState.pagesCount"(pagesCount, oldPagesCount) {
      if (!this.ready) return;
      this.pdfState.savePDFState();
    },

    "pdfState.currentPageNumber"(pageNumber, _) {
      if (!this.ready) return;
      this.pdfState.savePDFState();
    },

    "pdfState.spreadMode"(spreadMode, _) {
      if (!this.ready) return;
      this.changeSpreadMode(spreadMode);
      this.pdfState.savePDFState();
    },

    "pdfState.tool"(tool, _) {
      if (!this.ready) return;
      this.pdfState.savePDFState();
    },

    "pdfState.color"(color, _) {
      if (!this.ready) return;
      this.pdfState.savePDFState();
    },

    "pdfState.search": {
      handler(search) {
        if (!this.ready) return;
        this.searchText(search);
      },
      deep: true,
    },

    "pdfState.selectedOutlineNode"(node, _) {
      this.pdfApp.getTOCPage(node).then((pageNumber) => {
        this.changePageNumber(pageNumber);
      });
    },

    "annotStore.selectedAnnotId"(annotId, _) {
      console.log(annotId);
      // remove active class
      this.setActiveAnnotation(null);

      if (!!!annotId) return;
      this.annotStore.getAnnotById(annotId).then((annot) => {
        let dom = document.querySelector(`section[annotation-id="${annotId}"]`);
        if (!!dom) {
          // highlight it if we can find they directly
          this.setActiveAnnotation(annotId);
          // scroll into view
          dom.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "nearest",
          });
        } else {
          this.changePageNumber(annot.pageNumber);
        }
      });
    },
  },

  methods: {
    changePageNumber(pageNumber) {
      this.pdfApp.pdfViewer.currentPageNumber = parseInt(pageNumber);
    },

    changeSpreadMode(spreadMode) {
      this.pdfApp.pdfViewer.spreadMode = parseInt(spreadMode);
    },

    changeScale(params) {
      // change scale
      if (params.delta) {
        this.pdfApp.pdfViewer.currentScale += params.delta;
      } else if (params.scaleValue) {
        this.pdfApp.pdfViewer.currentScaleValue = params.scaleValue;
      }

      // save the state
      let scale = this.pdfApp.pdfViewer.currentScale;
      let scaleValue = this.pdfApp.pdfViewer.currentScaleValue;
      this.pdfState.currentScale = scale;
      this.pdfState.currentScaleValue = scaleValue;

      if (this.ready) {
        this.pdfState.savePDFState();
      }
    },

    searchText(search) {
      // search = {query: "", highlightAll: true, caseSensitive: false, entireWord: false}
      this.pdfApp.eventBus.dispatch("find", search);
    },

    changeMatch(delta) {
      // delta can only be +1 (next) or -1 (prev)
      // highlight the next/previous match
      let findController = this.pdfApp.pdfFindController;

      let currentMatch = findController.selected;
      let pageIdx = currentMatch.pageIdx;
      let newMatchIdx = currentMatch.matchIdx + delta;

      let matches = findController.pageMatches;
      let matchIdxList = matches[pageIdx];

      while (newMatchIdx < 0 || newMatchIdx > matchIdxList.length - 1) {
        pageIdx += delta;
        let mod = pageIdx % this.pdfState.pagesCount; // mod can be negative
        pageIdx = mod >= 0 ? mod : this.pdfState.pagesCount - Math.abs(mod);
        // if next: select first match (delta-1 = 0) in the next available pages
        // if prev: select last match (length-1) in the previous available pages
        matchIdxList = matches[pageIdx];
        newMatchIdx = delta > 0 ? 0 : matchIdxList.length - 1;
      }

      if (newMatchIdx < 0) newMatchIdx = 0;
      if (newMatchIdx > matchIdxList.length)
        newMatchIdx = matchIdxList.length - 1;

      this.pdfApp.pdfFindController.selected.pageIdx = pageIdx;
      this.pdfApp.pdfFindController.selected.matchIdx = newMatchIdx;
      this.changePageNumber(pageIdx + 1);
      this.pdfApp.eventBus.dispatch("updatetextlayermatches", {
        source: findController,
        pageIndex: pageIdx,
      });
    },

    drawAnnotations(pageNumber) {
      let annots = this.annotStore.getAnnotsByPage(pageNumber);
      for (let annot of annots) {
        this.annotStore.create(annot, true).then((doms) => {
          // bind function to dom
          for (let dom of doms) dom.onclick = () => this.clickAnnotation(dom);
        });
      }
    },

    createAnnotation(pageNumber, mouseEvent) {
      let rect = null;
      if (this.pdfState.tool == AnnotationType.COMMENT)
        rect = {
          left: mouseEvent.clientX,
          top: mouseEvent.clientY,
          width: 40,
          height: 40,
        };
      this.annotStore
        .create({
          type: this.pdfState.tool,
          rect: rect, // only for comment annotation
          color: this.pdfState.color,
          pageNumber: pageNumber,
        })
        .then((doms) => {
          // if no doms, that means we are just clicking the page
          if (doms.length == 0) this.annotStore.selectedAnnotId = null;

          // bind function to dom
          for (let dom of doms) {
            dom.onclick = () => this.clickAnnotation(dom);
            if (this.pdfState.tool == AnnotationType.COMMENT) {
              dom.click(); // open the annotation list
              this.pdfState.tool = "cursor"; // prevent adding note ontop of note
            }
          }
        });
    },

    clickAnnotation(dom) {
      // open info pane
      if (this.stateStore.infoPaneSize == 0) this.stateStore.toggleInfoPane();
      this.stateStore.setInfoPaneTab("annotationTab");
      setTimeout(() => {
        // IMPROVE: improve wait until the annotation list is ready
        this.annotStore.selectedAnnotId = dom.getAttribute("annotation-id");
      }, 100);
    },

    setActiveAnnotation(annotId) {
      if (!!annotId) {
        // highlight it
        let doms = document.querySelectorAll(
          `section[annotation-id="${annotId}"]`
        );
        for (let dom of doms) {
          dom.classList.add("activeAnnotation");
        }
      } else {
        // deselect annotation
        let doms = document.querySelectorAll(".activeAnnotation");
        for (let dom of doms) {
          dom.classList.remove("activeAnnotation");
        }
      }
    },
  },
};
</script>

<style lang="scss">
@import "pdfjs-dist/web/pdf_viewer.css";
#viewerContainer {
  position: absolute;
  overflow: auto;
  // systembar: 32px toolbar: 36px
  height: calc(100vh - 68px);
  top: 36px;
  width: 99%; // so the right scroll bar does not touch right edge
  margin-right: 10px;
}

#peekContainer {
  position: absolute;
  overflow: auto;
  background: grey;
  border: solid black 5px;
  border-radius: 5px;
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
  border: dashed 2px cyan;
}

.q-splitter__after {
  // hide the bottom scrollbar in pdf page
  overflow: hidden;
}

// scrollbar styles in pdfreader
/* width */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

/* handle */
::-webkit-scrollbar-thumb {
  background: rgb(75, 75, 75);
  border-radius: 10px;
  &:hover {
    background: #005cb3;
  }
}

/* corner */
::-webkit-scrollbar-corner {
  color: transparent;
}
</style>
