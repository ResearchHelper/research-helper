import * as pdfjsLib from "pdfjs-dist";
import * as pdfjsViewer from "pdfjs-dist/web/pdf_viewer";
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "node_modules/pdfjs-dist/build/pdf.worker.min.js";

import { GrabToPan } from "./grabToPan";

export class PeekManager {
  handtool: GrabToPan;
  viewerContainer: HTMLElement; // the main viewer container
  peekCard: HTMLElement; // the card containing peeked page within viewer container
  pdfViewer: pdfjsViewer.PDFSinglePageViewer;
  linkService: pdfjsViewer.PDFLinkService;

  constructor(viewerContainer: HTMLDivElement, peekCard: HTMLDivElement) {
    const eventBus = new pdfjsViewer.EventBus();
    const pdfLinkService = new pdfjsViewer.PDFLinkService({
      eventBus,
    });

    const peekContainer = peekCard.querySelector(
      ".peekContainer"
    ) as HTMLDivElement;

    const pdfSinglePageViewer = new pdfjsViewer.PDFSinglePageViewer({
      container: peekContainer,
      eventBus: eventBus,
      linkService: pdfLinkService,
      textLayerMode: 0, // DISABLE: 0, ENABLE: 1
      annotationMode: pdfjsLib.AnnotationMode.DISABLE,
      l10n: pdfjsViewer.NullL10n,
    });
    pdfLinkService.setViewer(pdfSinglePageViewer);

    peekCard.addEventListener("mousewheel", (e) =>
      this._handleZoom(e as WheelEvent)
    );
    this.handtool = new GrabToPan({ element: peekContainer });
    this.peekCard = peekCard;
    this.viewerContainer = viewerContainer;
    this.pdfViewer = pdfSinglePageViewer;
    this.linkService = pdfLinkService;
  }

  loadPDF(filePath: string) {
    // close any existing popup window first
    this.closeContainer();

    // load pdf
    // load cmaps for rendering translated fonts
    let cMapUrl = "";
    if (process.env.DEV)
      cMapUrl = new URL("../../../cmaps/", import.meta.url).href;
    else {
      console.log("url?", import.meta.url);
      cMapUrl = new URL("cmaps/", import.meta.url).href;
    }
    let buffer = window.fs.readFileSync(filePath);
    let loadingTask = pdfjsLib.getDocument({
      data: buffer,
      cMapUrl: cMapUrl,
      cMapPacked: true,
    });
    loadingTask.promise.then((pdfDocument) => {
      this.pdfViewer.setDocument(pdfDocument);
      this.linkService.setDocument(pdfDocument, null);
    });
  }

  /**
   * Peek an internal link
   * @param link - the <a> tag with internal link
   */
  peek(link: HTMLAnchorElement) {
    link.onmouseover = () => {
      let timeoutId = setTimeout(() => {
        // internal link is wrapped by an <section> tag
        // this section tag has class linkAnnotation
        // and it is in annotationLayer of pdfjs
        let linkAnnot = link.parentElement as HTMLElement;
        this.pdfViewer.linkService.setHash(link.href.split("#")[1]);
        this.showContainer(linkAnnot);
        this.handtool.activate();
      }, 500);

      link.onmouseleave = () => clearTimeout(timeoutId);
    };
    this.peekCard.onmouseleave = () => {
      this.closeContainer();
    };
  }

  showContainer(annot: HTMLElement) {
    let annotRect = annot.getBoundingClientRect();
    let viewerRect = this.viewerContainer.getBoundingClientRect();

    // peekCard dimension (in px)
    let vw = viewerRect.width;
    let vh = viewerRect.height;

    let x1 = annotRect.x - viewerRect.x;
    let y1 = annotRect.y - viewerRect.y;

    let w = (viewerRect.width * 2) / 3;
    let h = viewerRect.height / 2;

    // anchor point
    let left = annotRect.x - viewerRect.x;
    let top = annotRect.y - viewerRect.y;

    // set anchor point to center bottom
    left -= w / 2;
    top -= h + 5;

    if (x1 < w / 2) {
      // left region
      left += w / 2 + annotRect.width;
    } else if (x1 > vw - w / 2) {
      // right region
      left -= w / 2;
    }

    if (y1 < h) {
      // up region
      top += annotRect.height + h + 10;
    }

    // position relative to viewerContainer
    this.peekCard.style.position = "relative";
    this.peekCard.style.top = top + "px";
    this.peekCard.style.left = left + "px";
    this.peekCard.style.width = w + "px";
    this.peekCard.style.height = h + "px";
    this.peekCard.style.display = "block";
    this.peekCard.style.zIndex = "1000";
  }

  closeContainer() {
    // this.peekCard.style.display = "none";
  }

  changeViewMode(isDarkMode: boolean) {
    if (!this.peekCard) return;
    if (isDarkMode)
      this.peekCard.style.filter =
        "invert(64%) contrast(228%) brightness(80%) hue-rotate(180deg)";
    else this.peekCard.style.filter = "unset";
  }

  private _handleZoom(e: WheelEvent) {
    e.preventDefault();
    this.pdfViewer.currentScale += e.deltaY < 0 ? 0.1 : -0.1;
  }
}
