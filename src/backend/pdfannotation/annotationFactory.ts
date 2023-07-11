import {
  Annotation,
  Highlight,
  Underline,
  Strikeout,
  Rectangle,
  Comment,
  Ink,
} from "./annotations";
import { AnnotationType, AnnotationData, Rect, PDFState } from "../database";
import { uid } from "quasar";
import AnnotationStore from "./annotationStore";
import { PDFPageView } from "pdfjs-dist/web/pdf_viewer";

/**
 * use event handlers to generate different annotation classes
 */
export default class AnnotationFactory {
  viewer: HTMLElement;
  pdfState: PDFState;
  activePages: number[]; // active page numbers
  store: AnnotationStore;

  constructor(viewer: HTMLElement, pdfState: PDFState, store: AnnotationStore) {
    this.viewer = viewer;
    this.pdfState = pdfState;
    this.activePages = [];
    this.store = store;
  }

  /**
   * Get user selected rects
   * @returns selection rectangles
   */
  private getSelectionRects(): Rect[] {
    let selection = window.getSelection();
    if (!selection || selection.isCollapsed) return [];
    let range = selection.getRangeAt(0);
    // convert DOMRectList to Array since we need filter function
    let rects = Array.from(range.getClientRects());

    // remove invalid selection
    rects = rects.filter((rect) => {
      return rect.width > 0.5 && rect.height > 0;
    });

    // remove repeated rectangles
    let left: number;
    let top: number;
    let dx = 0;
    let dy = 0;
    let prvRectWidth: number;
    rects = rects.filter((rect, index) => {
      if (index === 0) {
        left = rect.left;
        top = rect.top;
        prvRectWidth = rect.width;
        return true;
      } else {
        dx = Math.abs(rect.left - left); // Number-undefined = NaN = Number
        dy = Math.abs(rect.top - top);
        left = rect.left;
        top = rect.top;
        if (dx > prvRectWidth / 2 || dy > rect.height / 2) {
          prvRectWidth = rect.width;
          return true;
        }
      }
    });

    // join rectangles
    let newRects = [] as Rect[];
    let len = 0;
    for (let rect of rects) {
      if (len == 0) {
        newRects.push({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
        len++;
      } else if (
        Math.abs(newRects[len - 1].top - rect.top) <
        newRects[len - 1].height / 3
      ) {
        newRects[len - 1].width = rect.right - newRects[len - 1].left;
      } else {
        newRects.push({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
        len++;
      }
    }

    return newRects;
  }

  private offsetTransform(rect: Rect, canvasWrapper: HTMLElement) {
    let ost = this.computePageOffset(canvasWrapper);
    let left_1 = rect.left - ost.left;
    let top_1 = rect.top - ost.top;
    // calculate the rectt on UI (using percentage since it's invariant under scale change)
    return {
      left: (left_1 / ost.width) * 100,
      top: (top_1 / ost.height) * 100,
      width: (rect.width / ost.width) * 100,
      height: (rect.height / ost.height) * 100,
    };
  }

  private computePageOffset(canvasWrapper: HTMLElement): Rect {
    let rect = canvasWrapper.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    } as Rect;
  }

  setState(pdfState: PDFState) {
    this.pdfState = pdfState;
  }

  /**
   * Set event handlers on page
   * if no pageNumber is given, that means user is changing tools and other things...
   * @param e
   */
  setEventHandlers(e: {
    error: Error | null;
    pageNumber: number;
    source: PDFPageView;
  }) {
    e.source.div.onmousedown = (ev: MouseEvent) => {
      switch (this.pdfState.tool) {
        case AnnotationType.HIGHLIGHT:
        case AnnotationType.UNDERLINE:
        case AnnotationType.STRIKEOUT:
          e.source.div.onmouseup = () =>
            this.buildSelectionBasedAnnot(
              this.pdfState.tool,
              this.pdfState.color,
              e.pageNumber
            );
          break;
        case AnnotationType.RECTANGLE:
          let canvasWrapper = e.source.div.querySelector(
            ".canvasWrapper"
          ) as HTMLElement;
          // temporary rectangle for rectangular highlight
          let x1 = ev.clientX;
          let y1 = ev.clientY;
          let layerRect = canvasWrapper.getBoundingClientRect();
          let tempRect = document.createElement("div");
          tempRect.style.position = "absolute";
          tempRect.style.background = this.pdfState.color;
          tempRect.style.mixBlendMode = "multiply";
          tempRect.style.left = `${x1 - layerRect.x}px`;
          tempRect.style.top = `${y1 - layerRect.y}px`;
          canvasWrapper.append(tempRect);

          e.source.div.onmousemove = (ev: MouseEvent) => {
            ev.preventDefault();
            if (!tempRect) return;
            tempRect.style.width = `${ev.clientX - x1}px`;
            tempRect.style.height = `${ev.clientY - y1}px`;
          };
          e.source.div.onmouseup = (ev: MouseEvent) => {
            tempRect.remove();
            // create annotation
            let rects = [
              {
                left: Math.min(x1, ev.clientX),
                top: Math.min(y1, ev.clientY),
                width: Math.abs(x1 - ev.clientX),
                height: Math.abs(y1 - ev.clientY),
              },
            ];
            if (rects[0].width < 1 || rects[0].height < 1) return;
            rects[0] = this.offsetTransform(rects[0], canvasWrapper);

            let annotData = {
              _id: uid(),
              _rev: "",
              type: AnnotationType.RECTANGLE,
              rects: rects,
              color: this.pdfState.color,
              pageNumber: e.pageNumber,
              projectId: this.pdfState.projectId,
              dataType: "pdfAnnotation",
              content: "",
            } as AnnotationData;
            let annot = this.build(annotData);
            if (annot) {
              let id = annot.data._id;
              annot.draw();
              annot.doms.forEach((dom) => {
                dom.onmousedown = () => this.store.setActive(id);
              });
              this.store.add(annot, true);
            }
            e.source.div.onmousemove = null;
            e.source.div.onmouseup = null;
          };
          break;
        case AnnotationType.COMMENT:
          e.source.div.onmouseup = (ev: MouseEvent) => {
            let canvasWrapper = e.source.div.querySelector(
              ".canvasWrapper"
            ) as HTMLElement;
            // create annotation
            let rects = [
              {
                left: ev.clientX,
                top: ev.clientY,
                width: 0,
                height: 0,
              },
            ];
            rects[0] = this.offsetTransform(rects[0], canvasWrapper);
            let annotData = {
              _id: uid(),
              _rev: "",
              type: AnnotationType.COMMENT,
              rects: rects,
              color: this.pdfState.color,
              pageNumber: e.pageNumber,
              projectId: this.pdfState.projectId,
              dataType: "pdfAnnotation",
              content: "",
            } as AnnotationData;
            let annot = this.build(annotData);
            if (annot) {
              let id = annot.data._id;
              annot.draw();
              annot.doms.forEach((dom) => {
                dom.onmousedown = () => this.store.setActive(id);
                dom.onblur = () => {
                  console.log("blur!!!!");
                };
              });
              this.store.add(annot, true);
            }
          };
          break;
        case AnnotationType.INK:
          break;
      }
    };
  }

  /**
   * Build Annotation by annotation data
   * @param annotData
   * @returns
   */
  build(annotData: AnnotationData) {
    let annot: Annotation | null;
    switch (annotData.type) {
      case AnnotationType.HIGHLIGHT:
        annot = new Highlight(annotData, this.viewer);
        break;
      case AnnotationType.UNDERLINE:
        annot = new Underline(annotData, this.viewer);
        break;
      case AnnotationType.STRIKEOUT:
        annot = new Strikeout(annotData, this.viewer);
        break;
      case AnnotationType.RECTANGLE:
        annot = new Rectangle(annotData, this.viewer);
        break;
      case AnnotationType.COMMENT:
        annot = new Comment(annotData, this.viewer);
        break;
      case AnnotationType.INK:
        annot = new Ink(annotData, this.viewer);
        break;
      default:
        annot = null;
        break;
    }
    return annot;
  }

  /**
   * Used to build Highlight, Underline, and Strikeout annotation
   * @param tool
   * @param color
   * @param pageNumber
   * @returns
   */
  buildSelectionBasedAnnot(
    tool: AnnotationType,
    color: string,
    pageNumber: number
  ) {
    let rects = this.getSelectionRects();
    if (rects.length === 0) return;
    let canvasWrapper = this.viewer
      .querySelector(`div.page[data-page-number='${pageNumber}']`)
      ?.querySelector(".canvasWrapper") as HTMLElement;
    for (let [i, rect] of rects.entries())
      rects[i] = this.offsetTransform(rect, canvasWrapper);

    let annotData = {
      _id: uid(),
      _rev: "",
      type: tool,
      rects: rects,
      color: color,
      pageNumber: pageNumber,
      projectId: this.pdfState.projectId,
      dataType: "pdfAnnotation",
      content: "",
    } as AnnotationData;

    let annot = this.build(annotData);
    if (annot) {
      annot.draw();
      this.store.add(annot, true);
    }
  }
}
