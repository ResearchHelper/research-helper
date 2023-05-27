import * as pdfjsLib from "pdfjs-dist";
import * as pdfjsViewer from "pdfjs-dist/web/pdf_viewer";
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "node_modules/pdfjs-dist/build/pdf.worker.min.js";

import { PeekManager } from "./pdfpeek";
import { db, PDFSearch, PDFState, SpreadMode, TOCNode } from "../database";
import { debounce } from "quasar";

class PDFApplication {
  container: HTMLDivElement;
  peekContainer: HTMLDivElement;
  eventBus: pdfjsViewer.EventBus;
  pdfLinkService: pdfjsViewer.PDFLinkService;
  pdfFindController: pdfjsViewer.PDFFindController;
  pdfViewer: pdfjsViewer.PDFViewer;
  peekManager: PeekManager;
  pdfDocument: pdfjsLib.PDFDocumentProxy | undefined;

  // saveState: typeof debounce<(state: PDFState) => Promise<void>>;
  saveState: ((this: unknown, state: PDFState) => void) & {
    cancel(): void;
  };

  constructor(container: HTMLDivElement, peekContainer: HTMLDivElement) {
    const eventBus = new pdfjsViewer.EventBus();
    const pdfLinkService = new pdfjsViewer.PDFLinkService({
      eventBus,
    });
    const pdfFindController = new pdfjsViewer.PDFFindController({
      eventBus,
      linkService: pdfLinkService,
    });

    // l10n resource
    const link = document.createElement("link");
    link.rel = "resources";
    link.type = "application/l10n";
    link.href = "l10n/en-US/viewer.properties";
    document.head.append(link);
    const l10n = new pdfjsViewer.GenericL10n("en-US");

    const pdfViewer = new pdfjsViewer.PDFViewer({
      container,
      eventBus: eventBus,
      linkService: pdfLinkService,
      findController: pdfFindController,
      annotationEditorMode: pdfjsLib.AnnotationEditorType.NONE,
      l10n: l10n,
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
    this.pdfDocument = undefined; // initialize in loadPDF

    // install internal event listener
    eventBus.on("pagesinit", () => {
      this.container.addEventListener("mousewheel", (e) =>
        this.handleCtrlScroll(e as WheelEvent)
      );
    });

    eventBus.on("annotationlayerrendered", () => {
      this.container
        .querySelectorAll("section.linkAnnotation")
        .forEach((section) => {
          let link = section.querySelector("a");
          if (!link) return;
          if (section.hasAttribute("data-internal-link")) {
            // peek internal links
            this.peekManager.peek(link);
          } else {
            // external links must open using default browser
            let href = link.href;
            link.onclick = (e) => {
              e.preventDefault();
              window.browser.openURL(href);
            };
          }
        });
    });

    // make saveState a debounce function
    // it ignores the signals 500ms after each call
    this.saveState = debounce(this._saveState, 500);
  }

  async loadPDF(filePath: string) {
    // load cmaps for rendering translated fonts
    let cMapUrl = "";
    if (process.env.DEV)
      cMapUrl = new URL("../../../cmaps/", import.meta.url).href;
    else {
      console.log("url?", import.meta.url);
      cMapUrl = new URL("cmaps/", import.meta.url).href;
    }
    let buffer = window.fs.readFileSync(filePath);
    this.pdfDocument = await pdfjsLib.getDocument({
      data: buffer,
      cMapUrl: cMapUrl,
      cMapPacked: true,
    }).promise;
    this.pdfLinkService.setDocument(this.pdfDocument, null);
    this.pdfFindController.setDocument(this.pdfDocument);
    this.pdfViewer.setDocument(this.pdfDocument);
    this.peekManager.loadPDF(filePath);
  }

  async loadState(projectId: string): Promise<PDFState | undefined> {
    try {
      let result = await db.find({
        selector: { dataType: "pdfState", projectId: projectId },
      });

      let state = result.docs[0] as PDFState;
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
        } as PDFState;
      }
      return state;
    } catch (error) {
      console.log(error);
    }
  }

  private async _saveState(state: PDFState) {
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

  changePageNumber(pageNumber: number) {
    this.pdfViewer.currentPageNumber = pageNumber;
  }

  changeSpreadMode(spreadMode: SpreadMode) {
    this.pdfViewer.spreadMode = spreadMode;
  }

  changeScale(params: {
    delta?: number;
    scaleValue?: "page-width" | "page-height";
    scale?: number;
  }) {
    if (!!params.delta) this.pdfViewer.currentScale += params.delta;

    if (!!params.scaleValue)
      this.pdfViewer.currentScaleValue = params.scaleValue;

    if (!!params.scale) this.pdfViewer.currentScale = params.scale;
  }

  handleCtrlScroll(e: WheelEvent) {
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

  async getPageLabels(): Promise<string[]> {
    if (this.pdfDocument === undefined) return [];
    let labels = await this.pdfDocument.getPageLabels();
    if (labels === null) labels = [];
    return labels;
  }

  async getTOC(): Promise<TOCNode[]> {
    if (this.pdfDocument === undefined) return [];

    function _dfs(oldNodes: TOCNode[]): TOCNode[] {
      const tree = [] as TOCNode[];
      for (let k in oldNodes) {
        let node = {
          label: oldNodes[k].title,
          children: _dfs(oldNodes[k].items),
        } as TOCNode;
        if (typeof oldNodes[k].dest === "string") node.dest = oldNodes[k].dest;
        else {
          let dest = oldNodes[k].dest;
          if (!!dest && dest?.length > 0) node.ref = dest[0];
        }
        tree.push(node);
      }
      return tree;
    }

    try {
      let outline = await this.pdfDocument.getOutline();
      return _dfs(outline as TOCNode[]);
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  /**
   * Get page number of a TOCNode
   */
  async getTOCPage(node: TOCNode): Promise<number> {
    if (this.pdfDocument === undefined) return 1;

    let pageNumber = 1;

    if (node.ref === undefined) {
      let dest = await this.pdfDocument.getDestination(node.dest as string);
      if (!!dest && dest?.length > 0) {
        let ref = dest[0];
        let pageIndex = await this.pdfDocument.getPageIndex(ref);
        pageNumber = pageIndex + 1;
      }
    } else {
      let pageIndex = await this.pdfDocument.getPageIndex(node.ref);
      pageNumber = pageIndex + 1;
    }
    return pageNumber;
  }

  async clickTOC(node: TOCNode) {
    let pageNumber = await this.getTOCPage(node);
    this.changePageNumber(pageNumber);
  }

  searchText(search: PDFSearch) {
    this.eventBus.dispatch("find", search);
  }

  changeMatch(delta: number) {
    // delta can only be +1 (next) or -1 (prev)
    // highlight the next/previous match
    if (this.pdfFindController.selected === undefined) return;
    if (this.pdfFindController.pageMatches === undefined) return;

    let currentMatch = this.pdfFindController.selected;
    let matches = this.pdfFindController.pageMatches;

    let pageIdx = currentMatch.pageIdx;
    let newMatchIdx = currentMatch.matchIdx + delta;
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
      source: this.pdfFindController,
      pageIndex: pageIdx,
    });
  }
}

export { PDFApplication };
