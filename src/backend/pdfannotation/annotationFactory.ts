import {
  Annotation,
  Highlight,
  Underline,
  Strikeout,
  Rectangle,
  Comment,
  Ink,
} from "./annotations";
import { AnnotationType, AnnotationData, Rect } from "../database";
import { uid } from "quasar";
import { PDFPageView } from "pdfjs-dist/web/pdf_viewer";

/**
 * use event handlers to generate different annotation classes
 */
export default class AnnotationFactory {
  projectId: string;

  constructor(projectId: string) {
    this.projectId = projectId;
  }

  /**
   * Get user selected rects
   * @returns selection rectangles
   */
  getSelectionRects(): Rect[] {
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

  offsetTransform(rect: Rect, canvasWrapper: HTMLElement) {
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

  computePageOffset(canvasWrapper: HTMLElement): Rect {
    let rect = canvasWrapper.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    } as Rect;
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
        annot = new Highlight(annotData);
        break;
      case AnnotationType.UNDERLINE:
        annot = new Underline(annotData);
        break;
      case AnnotationType.STRIKEOUT:
        annot = new Strikeout(annotData);
        break;
      case AnnotationType.RECTANGLE:
        annot = new Rectangle(annotData);
        break;
      case AnnotationType.COMMENT:
        annot = new Comment(annotData);
        break;
      case AnnotationType.INK:
        annot = new Ink(annotData);
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
   * @param e
   * @returns
   */
  buildSelectionBasedAnnot(
    tool: AnnotationType,
    color: string,
    e: { pageNumber: number; source: PDFPageView }
  ) {
    let rects = this.getSelectionRects();
    if (rects.length === 0) return;
    let canvasWrapper = e.source.canvas?.parentElement as HTMLElement;
    for (let [i, rect] of rects.entries())
      rects[i] = this.offsetTransform(rect, canvasWrapper);

    let annotData = {
      _id: uid(),
      _rev: "",
      timestampAdded: Date.now(),
      timestampModified: Date.now(),
      type: tool,
      rects: rects,
      color: color,
      pageNumber: e.pageNumber,
      projectId: this.projectId,
      dataType: "pdfAnnotation",
      content: "",
    } as AnnotationData;

    return this.build(annotData);
  }
}
