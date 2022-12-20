import * as pdfjsLib from "pdfjs-dist/build/pdf";
import * as pdfjsViewer from "pdfjs-dist/web/pdf_viewer";
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "node_modules/pdfjs-dist/build/pdf.worker.min.js";

import { PeekManager } from "./pdfpeek";
import { AnnotationType } from "./annotation";
import { db } from "../database";
import debounce from "lodash/debounce";

class PDFApplication {
  constructor(container, peekContainer) {
    const eventBus = new pdfjsViewer.EventBus();
    const pdfLinkService = new pdfjsViewer.PDFLinkService({
      eventBus,
    });
    const pdfFindController = new pdfjsViewer.PDFFindController({
      eventBus,
      linkService: pdfLinkService,
    });

    const pdfViewer = new pdfjsViewer.PDFViewer({
      container,
      eventBus: eventBus,
      linkService: pdfLinkService,
      findController: pdfFindController,
      annotationEditorMode: pdfjsLib.AnnotationEditorType.NONE,
    });
    pdfLinkService.setViewer(pdfViewer);

    this.container = container;
    this.peekContainer = peekContainer;
    this.eventBus = eventBus;
    this.pdfLinkService = pdfLinkService;
    this.pdfFindController = pdfFindController;
    this.pdfViewer = pdfViewer;
    this.peekManager = new PeekManager(container, peekContainer);

    // install internal event listener
    eventBus.on("pagesinit", (e) => {
      this.container.addEventListener("mousewheel", (e) =>
        this.handleCtrlScroll(e)
      );
    });

    eventBus.on("annotationeditorlayerrendered", (e) => {
      // peek hyperlinks
      let links = this.container.querySelectorAll("a.internalLink");
      for (let link of links) this.peekManager.peak(link);
    });

    // make saveState a debounce function
    // it ignores the signals 500ms after each call
    this.saveState = debounce(this._saveState, 500);
  }

  async loadPDF(filePath) {
    let buffer = window.fs.readFileSync(filePath);
    this.pdfDocument = await pdfjsLib.getDocument({ data: buffer }).promise;
    this.pdfLinkService.setDocument(this.pdfDocument, null);
    this.pdfViewer.setDocument(this.pdfDocument);
    this.peekManager.loadPDF(filePath);
  }

  async loadState(projectId) {
    try {
      let result = await db.find({
        selector: { dataType: "pdf_state", projectId: projectId },
      });

      let state = result.docs[0];
      if (!!!state) {
        state = {
          dataType: "pdf_state",
          projectId: projectId,
          pagesCount: 0,
          currentPageNumber: 1,
          currentScale: 1,
          currentScaleValue: "1",
          spreadMode: 0,
          tool: "cursor",
          color: "#FFFF00",
          scrollLeft: 0,
          scrollTop: 0,
        };
      }
      return state;
    } catch (error) {
      console.log(error);
    }
  }

  async _saveState(state) {
    // also save the scroll position
    state.scrollLeft = this.container.scrollLeft;
    state.scrollTop = this.container.scrollTop;

    try {
      if (!!state._id) {
        let oldState = await db.get(state._id);
        state._rev = oldState._rev;
        await db.put(state);
      } else {
        await db.post(state);
      }
    } catch (error) {
      console.log(error);
    }

    // cancel debounce after 400ms
    setTimeout(() => {
      this.saveState.cancel();
    }, 400);
  }

  handleCtrlScroll(e) {
    if (e.ctrlKey === true) {
      // this is not scrolling, so we need to
      // disable the default action avoid the offsetParent not set error
      e.preventDefault();
      if (e.deltaY < 0) {
        let oldScale = this.pdfViewer.currentScale;
        this.pdfViewer.currentScale += 0.1;
        let newScale = this.pdfViewer.currentScale;
        let container = this.container;
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
  }

  async getTOC() {
    if (!!this.pdfDocument == false) return;
    function _dfs(oldNode) {
      var tree = [];
      for (var k in oldNode) {
        let node = {
          label: oldNode[k].title,
          children: _dfs(oldNode[k].items),
        };
        if (typeof oldNode[k].dest === "string") node.dest = oldNode[k].dest;
        else node.ref = oldNode[k].dest[0];
        tree.push(node);
      }
      return tree;
    }

    let outline = await this.pdfDocument.getOutline();
    return _dfs(outline);
  }

  /**
   *
   * @param {Object} node the selected outline node
   * @returns {Number} pageNumber
   */
  async getTOCPage(node) {
    let pageNumber = null;
    if (node.ref === undefined) {
      let dest = await this.pdfDocument.getDestination(node.dest);
      let ref = dest[0];
      let pageIndex = await this.pdfDocument.getPageIndex(ref);
      pageNumber = pageIndex + 1;
    } else {
      let pageIndex = await this.pdfDocument.getPageIndex(node.ref);
      pageNumber = pageIndex + 1;
    }
    return pageNumber;
  }
}

export { PDFApplication, AnnotationType };
