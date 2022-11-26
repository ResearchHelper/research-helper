import * as pdfjsLib from "pdfjs-dist/build/pdf";
import * as pdfjsViewer from "pdfjs-dist/web/pdf_viewer";
pdfjsLib.GlobalWorkerOptions.workerSrc = "pdfjs-dist/build/pdf.worker.min.js";

import { GrabToPan } from "./grab_to_pan";

class PeekManager {
  constructor() {
    let container = document.getElementById("peekContainer");
    this.container = container;
    const eventBus = new pdfjsViewer.EventBus();
    const pdfLinkService = new pdfjsViewer.PDFLinkService({
      eventBus,
    });

    const pdfSinglePageViewer = new pdfjsViewer.PDFSinglePageViewer({
      container,
      eventBus,
      linkService: pdfLinkService,
      textLayerMode: 0, // DISABLE: 0, ENABLE: 1
      annotationMode: pdfjsLib.AnnotationMode.DISABLE,
    });
    pdfLinkService.setViewer(pdfSinglePageViewer);
    this.pdfViewer = pdfSinglePageViewer;
    this.linkService = pdfLinkService;

    container.addEventListener("mousewheel", (e) => this.handleZoom(e));
    this.handtool = new GrabToPan({ element: container });
  }

  loadPDF(filePath) {
    // close any existing popup window first
    this.closeContainer();

    // load pdf
    let buffer = window.fs.readFileSync(filePath);
    let loadingTask = pdfjsLib.getDocument({
      data: buffer,
    });
    loadingTask.promise.then((pdfDocument) => {
      this.pdfViewer.setDocument(pdfDocument);
      this.linkService.setDocument(pdfDocument, null);
    });
  }

  peak(link) {
    link.onmouseover = (ev) => {
      let annot = link.parentElement;
      this.showContainer(annot);
      this.pdfViewer.linkService.setHash(link.href.split("#")[1]);
      this.handtool.activate();
    };
    this.container.onmouseleave = () => {
      this.container.style.display = "none";
    };
  }

  showContainer(annot) {
    let annotRect = annot.getBoundingClientRect();
    let viewerRect = document
      .getElementById("viewerContainer")
      .getBoundingClientRect();

    // container dimension (in px)
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
    this.container.style.position = "relative";
    this.container.style.top = top + "px";
    this.container.style.left = left + "px";
    this.container.style.width = w + "px";
    this.container.style.height = h + "px";
    this.container.style.display = "block";
    this.container.style.zIndex = 1000;
  }

  closeContainer() {
    this.container.style.display = "none";
  }

  handleZoom(e) {
    e.preventDefault();
    if (e.deltaY < 0) {
      let oldScale = this.pdfViewer.currentScale;
      this.pdfViewer.currentScale += 0.1;
      let newScale = this.pdfViewer.currentScale;
      let oldX = this.container.scrollLeft + e.pageX;
      let oldY = this.container.scrollTop + e.pageY;

      // shift the scroll bar if cursor if too far from center
      if (e.pageX > window.innerWidth * (7 / 10))
        this.container.scrollLeft += (newScale / oldScale - 1) * oldX;
      else if (e.pageX < window.innerWidth * (3 / 10))
        this.container.scrollLeft -= (newScale / oldScale - 1) * oldX;
      if (e.pageY > window.innerHeight * (7 / 10))
        this.container.scrollTop += (newScale / oldScale - 1) * oldY;
      else if (e.pageY < window.innerHeight * (3 / 10))
        this.container.scrollTop -= (newScale / oldScale - 1) * oldY;
    } else {
      this.pdfViewer.currentScale -= 0.1;
    }
  }
}

export { PeekManager };
