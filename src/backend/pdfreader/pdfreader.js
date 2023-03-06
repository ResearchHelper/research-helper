import * as pdfjsLib from "pdfjs-dist/build/pdf";
import * as pdfjsViewer from "pdfjs-dist/web/pdf_viewer";
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "node_modules/pdfjs-dist/build/pdf.worker.min.js";

import { PeekManager } from "./pdfpeek";
import { AnnotationType } from "./annotation";
import { db } from "../database";
import { debounce } from "quasar";

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
    // must have this otherwise find controller does not work
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

    eventBus.on("annotationlayerrendered", (e) => {
      let links = this.container.querySelectorAll("a");
      for (let link of links) {
        if (link.classList.contains("internalLink")) {
          // peek internal links
          this.peekManager.peak(link);
        } else {
          // external links must open using default browser
          link.onclick = (e) => {
            e.preventDefault();
            window.browser.openURL(link.href);
          };
        }
      }
    });

    // make saveState a debounce function
    // it ignores the signals 500ms after each call
    this.saveState = debounce(this._saveState, 500);
  }

  async loadPDF(filePath) {
    let buffer = window.fs.readFileSync(filePath);
    this.pdfDocument = await pdfjsLib.getDocument({ data: buffer }).promise;
    this.pdfLinkService.setDocument(this.pdfDocument, null);
    this.pdfFindController.setDocument(this.pdfDocument);
    this.pdfViewer.setDocument(this.pdfDocument);
    this.peekManager.loadPDF(filePath);
  }

  async loadState(projectId) {
    try {
      let result = await db.find({
        selector: { dataType: "pdfState", projectId: projectId },
      });

      let state = result.docs[0];
      if (!!!state) {
        state = {
          dataType: "pdfState",
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

  changePageNumber(pageNumber) {
    this.pdfViewer.currentPageNumber = parseInt(pageNumber);
  }

  changeSpreadMode(spreadMode) {
    this.pdfViewer.spreadMode = parseInt(spreadMode);
  }

  /**
   * params = {delta?: Number, scaleValue?: 'page-width'|'page-height', scale?: Number}
   * @param {Object} params
   */
  changeScale(params) {
    if (!!params.delta) this.pdfViewer.currentScale += params.delta;

    if (!!params.scaleValue)
      this.pdfViewer.currentScaleValue = params.scaleValue;

    if (!!params.scale) this.pdfViewer.currentScale = params.scale;
  }

  handleCtrlScroll(e) {
    if (e.ctrlKey === true) {
      // this is not scrolling, so we need to
      // disable the default action avoid the offsetParent not set error
      e.preventDefault();
      if (e.deltaY < 0) {
        let container = this.container;
        let oldScale = this.pdfViewer.currentScale;
        this.pdfViewer.currentScale += 0.1;
        let newScale = this.pdfViewer.currentScale;

        let ratio = newScale / oldScale - 1;

        // shift the scroll bar if cursor is on the right / bottom of the screen
        // the default zoom-in takes the upper-left conner as scale origin
        if (e.pageX > window.innerWidth * (6 / 10))
          container.scrollLeft += ratio * (container.scrollLeft + e.pageX);
        if (e.pageY > window.innerHeight * (6 / 10))
          container.scrollTop += ratio * e.pageY;
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

    let toc = [];
    try {
      let outline = await this.pdfDocument.getOutline();
      toc = _dfs(outline);
    } catch (error) {
      console.log(error);
    }
    return toc;
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

  async clickTOC(node) {
    let pageNumber = await this.getTOCPage(node);
    this.changePageNumber(pageNumber);
  }

  /**
   * search = {query: "", highlightAll: true, caseSensitive: false, entireWord: false}
   * @param {Object} search
   */
  searchText(search) {
    this.eventBus.dispatch("find", search);
  }

  changeMatch(delta) {
    // delta can only be +1 (next) or -1 (prev)
    // highlight the next/previous match
    let findController = this.pdfFindController;

    let currentMatch = findController.selected;
    let pageIdx = currentMatch.pageIdx;
    let newMatchIdx = currentMatch.matchIdx + delta;

    let matches = findController.pageMatches;
    let matchIdxList = matches[pageIdx];

    while (newMatchIdx < 0 || newMatchIdx > matchIdxList.length - 1) {
      pageIdx += delta;
      let mod = pageIdx % this.pdfViewer.pagesCount; // mod can be negative
      pageIdx = mod >= 0 ? mod : this.pdfViewer.pagesCount - Math.abs(mod);
      // if next: select first match (delta-1 = 0) in the next available pages
      // if prev: select last match (length-1) in the previous available pages
      matchIdxList = matches[pageIdx];
      newMatchIdx = delta > 0 ? 0 : matchIdxList.length - 1;
    }

    if (newMatchIdx < 0) newMatchIdx = 0;
    if (newMatchIdx > matchIdxList.length)
      newMatchIdx = matchIdxList.length - 1;

    this.pdfFindController.selected.pageIdx = pageIdx;
    this.pdfFindController.selected.matchIdx = newMatchIdx;
    this.changePageNumber(pageIdx + 1);
    this.eventBus.dispatch("updatetextlayermatches", {
      source: findController,
      pageIndex: pageIdx,
    });
  }
}

export { PDFApplication, AnnotationType };
