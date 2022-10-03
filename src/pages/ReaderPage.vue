<template>
  <div>
    <PDFToolBar
      @changeScaleValue="
        (scaleValue) => (pdfViewer.currentScaleValue = scaleValue)
      "
      @changeScale="(deltaScale) => (pdfViewer.currentScale += deltaScale)"
      @changeSpreadMode="(spreadMode) => (pdfViewer.spreadMode = spreadMode)"
      @changeEditorMode="(editorMode) => enableEditorMode(editorMode)"
    />
    <q-splitter
      :style="'height:' + height + 'px;'"
      :limits="[0, 30]"
      separator-class="separator"
      v-model="stateStore.leftMenuSize"
      after-class="overflow-hidden"
    >
      <template v-slot:before>
        <PDFTOC
          :pdfDocument="pdfDocument"
          @clickTOC="(pageNumber) => scrollToPage(pageNumber)"
        />
      </template>
      <template v-slot:after>
        <q-splitter
          reverse
          :limits="[0, 60]"
          v-model="stateStore.infoPaneSize"
          separator-class="separator"
        >
          <template v-slot:before>
            <div id="viewerContainer">
              <div
                id="viewer"
                class="pdfViewer"
              ></div>
            </div>
          </template>
          <template v-slot:after>
            <InfoPane />
          </template>
        </q-splitter>
      </template>
    </q-splitter>

    <q-menu
      touch-position
      context-menu
      ref="contextMenu"
    >
      <q-list dense>
        <q-item
          clickable
          v-close-popup
        >
          Red
        </q-item>
        <q-item
          clickable
          v-close-popup
        >
          Delete
        </q-item>
      </q-list>
    </q-menu>
  </div>
</template>

<script>
import { isProxy, toRaw } from "vue";

import { useStateStore } from "src/stores/appState";
import InfoPane from "src/components/InfoPane.vue";
import PDFTOC from "src/components/PDFTOC.vue";
import PDFToolBar from "../components/PDFToolBar.vue";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import * as pdfjsViewer from "pdfjs-dist/web/pdf_viewer";
import { Annotation, AnnotationType } from "src/annotation";
pdfjsLib.GlobalWorkerOptions.workerSrc = "pdfjs-dist/build/pdf.worker.js";

export default {
  components: {
    InfoPane,
    PDFTOC,
    PDFToolBar,
  },

  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  data() {
    return {
      // layout
      height: window.innerHeight - 32 - 50,

      // pdf reader
      // pdfViewer: null, // DO NOT use this, otherwise pdfViewer becomes Proxy object
      pdfDocument: null,

      // for annotation
      annotationType: AnnotationType.NONE,

      // menu
      showContextMenu: false,
    };
  },

  watch: {
    "stateStore.workingProject"(project) {
      console.log("loading doc");
      this.loadPDF(project.path);
    },
  },

  computed: {
    pdfState() {
      let state = {
        pagesCount: this.pdfViewer.pagesCount,
        currentPageNumber: this.pdfViewer.currentPageNumber,
        currentScale: this.pdfViewer.currentScale,
        currentScaleValue: this.pdfViewer.currentScaleValue,
        spreadMode: this.pdfViewer.spreadMode,
      };
      console.log(state);
      return state;
    },
  },

  mounted() {
    // compute layout height
    this.computeHeight();
    window.addEventListener("resize", this.computeHeight);

    // pdf reader
    let container = document.getElementById("viewerContainer");
    let eventBus = new pdfjsViewer.EventBus();
    this.pdfViewer = new pdfjsViewer.PDFViewer({
      container,
      eventBus,
      annotationEditorMode: pdfjsLib.AnnotationEditorType.NONE,
    });
    this.loadPDF(this.stateStore.workingProject.path);

    eventBus.on("pagesloaded", () => {
      // ctrl+scroll to zoom
      document.addEventListener("mousewheel", (e) => this.ctrlScrollZoom(e));

      // for annotations
      let annotation = new Annotation(this.pdfViewer);
      // for (let dom of annotation.doms) {
      //   dom.oncontextmenu = this.toggleContextMenu;
      // }
      container.onmouseup = (e) => {
        let dom = annotation.createAnnotation({
          type: this.annotationType,
          rect: [e.clientX, e.clientY, 5, 5], // only for comment annotation
        });
        // if (!!dom) dom.oncontextmenu = this.toggleContextMenu;
      };
    });
  },

  methods: {
    computeHeight() {
      this.height = window.innerHeight - 32 - 50;
    },

    loadPDF(PDFRelativePath) {
      let loadingTask = pdfjsLib.getDocument({
        url: "http://localhost:5000/" + PDFRelativePath,
      });
      loadingTask.promise.then((pdfDocument) => {
        let viewer = this.pdfViewer;
        if (isProxy(this.pdfViewer)) viewer = toRaw(this.pdfViewer);
        viewer.setDocument(pdfDocument);
        this.pdfDocument = pdfDocument;
        this.loadPDFState();
      });
    },

    loadPDFState() {
      let state =
        this.stateStore.pdfStates[this.stateStore.workingProject.projectId];
      if (!state) return;
      this.pdfViewer.currentPageNumber = state.currentPageNumber;
      this.pdfViewer.currentScale = state.currentScale;
      this.pdfViewer.currentScaleValue = state.currentScaleValue;
      this.pdfViewer.spreadMode = state.spreadMode;
    },

    savePDFStates() {
      this.stateStore.setPDFState(this.pdfState);
      this.stateStore.savePDFStates();
    },

    scrollToPage(pageNumber) {
      this.pdfViewer.currentPageNumber = pageNumber;
      this.savePDFStates();
    },

    ctrlScrollZoom(e) {
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
        this.savePDFStates();
      }
    },

    enableEditorMode(editorMode) {
      console.log(editorMode);
      switch (editorMode) {
        case "NONE":
          this.pdfViewer.annotationEditorMode =
            pdfjsLib.AnnotationEditorType.NONE;
          this.annotationType = AnnotationType.NONE;
          break;

        case "HIGHLIGHT":
          this.annotationType = AnnotationType.HIGHLIGHT;
          break;

        case "COMMENT":
          this.annotationType = AnnotationType.COMMENT;
          break;

        case "FREETEXT":
          this.pdfViewer.annotationEditorMode =
            pdfjsLib.AnnotationEditorType.FREETEXT;
          this.annotationType = AnnotationType.FREETEXT;
          break;

        case "INK":
          this.pdfViewer.annotationEditorMode =
            pdfjsLib.AnnotationEditorType.INK;
          this.annotationType = AnnotationType.INK;
          break;
      }
    },

    toggleContextMenu() {
      console.log("rc");
      // this.showContextMenu = true;
      this.$refs.contextMenu.show();
    },
  },
};
</script>

<style lang="scss">
@import "pdfjs-dist/web/pdf_viewer.css";
#viewerContainer {
  position: absolute;
  overflow: auto;
  height: 100%;
  width: 100%;
  margin-right: 10px;
}
.separator {
  &:hover {
    width: 5px;
    background-color: $primary;
  }
  &:active {
    width: 5px;
    background-color: $primary;
  }
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
