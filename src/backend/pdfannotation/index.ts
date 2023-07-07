import { uid } from "quasar";
import { db, Annotation, Rect, AnnotationType } from "../database";
import { getSelectionRects, offsetTransform } from "./utils";
import {
  comment,
  highlight,
  rectangle,
  underline,
  strikeout,
  ink,
} from "./annotations";

async function getAnnotation(annotId: string): Promise<Annotation | undefined> {
  try {
    return (await db.get(annotId)) as Annotation;
  } catch (error) {
    console.log(error);
  }
}

/**
 * Get annotations of a project
 * @param projectId
 * @returns list of annotations
 */
async function getAnnotations(
  projectId: string
): Promise<Annotation[] | undefined> {
  try {
    let result = await db.find({
      selector: { dataType: "pdfAnnotation", projectId: projectId },
    });

    // to be compatiblle with earlier version 1.0.0-beta
    let updateFlag = false;
    let annots = result.docs as Annotation[];
    for (let annot of annots) {
      if (annot.type === AnnotationType.COMMENT && !annot.rects) {
        annot.rects = [(annot as Annotation & { rect: Rect }).rect];
        delete (annot as Annotation & { rect?: Rect }).rect;
        updateFlag = true;
      }
    }
    if (updateFlag) db.bulkDocs(annots);

    return annots;
  } catch (err) {
    console.log(err);
  }
}

/**
 * Add annotation to database
 * @param annot
 * @returns
 */
async function addAnnotation(annot: Annotation) {
  await db.put(annot);
}

/**
 * Update properties of an annotation with specific id
 * @param id - annotation id
 * @param props - new properties of the annotation
 * @public
 */
async function updateAnnotation(
  id: string,
  props: Annotation
): Promise<Annotation | undefined> {
  try {
    let annot = (await db.get(id)) as Annotation;
    props._rev = annot._rev;
    Object.assign(annot, props);
    await db.put(annot);
    return db.get(annot._id);
  } catch (err) {
    console.log(err);
  }
}

/**
 * Delete an annotation with specific id
 * @param annotId
 */
async function deleteAnnotation(annotId: string) {
  try {
    let annot = await db.get(annotId);
    await db.remove(annot);
  } catch (error) {
    console.log(error);
  }
}

// UI related

/**
 * Create Annotation data for database / annotationList use
 * @param container
 * @param pageNumber
 * @param tool
 * @param color
 * @param projectId
 * @param corner
 * @returns annot
 */
function createAnnotation(
  container: HTMLElement,
  pageNumber: number,
  tool: AnnotationType,
  color: string,
  projectId: string,
  corner: { x1: number; y1: number; x2: number; y2: number } | null
): Annotation | null {
  // get rects according to tools
  let rects = [] as Rect[];
  switch (tool) {
    case AnnotationType.COMMENT:
      // width and height are the same as commentIcon
      // so we don't need to set them
      if (corner === null) return {} as Annotation;
      rects[0] = {
        left: corner.x2,
        top: corner.y2,
        width: 0,
        height: 0,
      };
      break;
    case AnnotationType.RECTANGLE:
      if (corner === null) return {} as Annotation;
      rects[0] = {
        left: Math.min(corner.x1, corner.x2),
        top: Math.min(corner.y1, corner.y2),
        width: Math.abs(corner.x1 - corner.x2),
        height: Math.abs(corner.y1 - corner.y2),
      };
      break;
    default:
      // cursor select, highlight, underline
      rects = getSelectionRects();
      break;
  }

  // returns null if user just clicked somewhere on the page
  if (rects.length === 0) return null;
  else if (rects.length === 1 && tool !== AnnotationType.COMMENT) {
    if (rects[0].width < 1 || rects[0].height < 1) return null;
  }

  // transform rects to percentage relative to annotLayer
  let canvasWrapper = container
    ?.querySelector(`div.page[data-page-number='${pageNumber}']`)
    ?.querySelector(".canvasWrapper") as HTMLElement;
  for (let [i, rect] of rects.entries()) {
    rects[i] = offsetTransform(rect, canvasWrapper);
  }

  return {
    _id: uid(),
    type: tool,
    rects: rects,
    color: color,
    pageNumber: pageNumber,
    projectId: projectId,
    dataType: "pdfAnnotation",
    content: "",
  } as Annotation;
}

/**
 * Generate doms according to annot,
 * insert them to canvas,
 * then mount necessary eventhandler
 * @param annot
 */
function drawAnnotation(
  container: HTMLElement,
  annot: Annotation
): HTMLElement[] {
  let doms = [] as HTMLElement[];
  switch (annot.type) {
    case AnnotationType.COMMENT:
      doms = comment(container, annot);
      break;
    case AnnotationType.RECTANGLE:
      doms = rectangle(container, annot);
      break;
    case AnnotationType.HIGHLIGHT:
      doms = highlight(container, annot);
      break;
    case AnnotationType.UNDERLINE:
      doms = underline(container, annot);
      break;
    case AnnotationType.STRIKEOUT:
      doms = strikeout(container, annot);
      break;
    case AnnotationType.INK:
      doms = ink(container, annot);
      break;
  }

  return doms;
}

/**
 * Enable drag to move annotation
 * @param dom
 */
function enableDragToMove(dom: HTMLElement) {
  let annotLayerRect: Rect;
  let domRect: Rect;
  let offsetX = 0;
  let offsetY = 0;
  let shiftX = 0;
  let shiftY = 0;
  let left: number;
  let top: number;
  let tmpLeft: number;
  let tmpTop: number;

  dom.draggable = true;
  dom.ondragstart = (e) => {
    annotLayerRect = dom.parentElement?.getBoundingClientRect() as Rect;
    domRect = dom.getBoundingClientRect();
    offsetX = annotLayerRect.left;
    offsetY = annotLayerRect.top;
    shiftX = e.clientX - domRect.left;
    shiftY = e.clientY - domRect.top;
  };

  dom.ondrag = (e) => {
    // when drag is released, e.pageX and e.pageY will jump to 0, weird
    // need to calculate tmpLeft/tmpTop first to avoid this
    tmpLeft = e.pageX - offsetX - shiftX;
    tmpTop = e.pageY - offsetY - shiftY;

    if (tmpLeft < 0 || tmpLeft + domRect.width > annotLayerRect.width) return;
    if (tmpTop < 0 || tmpTop + domRect.height > annotLayerRect.height) return;

    left = (tmpLeft / annotLayerRect.width) * 100;
    top = (tmpTop / annotLayerRect.height) * 100;

    dom.style.left = `${left}%`;
    dom.style.top = `${top}%`;
  };

  dom.ondragend = (e) => {
    // left and top are in percentage
    // width and height are in px
    let id = dom.getAttribute("annotation-id") as string;
    updateAnnotation(id, {
      rects: [
        {
          left: left,
          top: top,
          width: parseFloat(dom.style.width),
          height: parseFloat(dom.style.height),
        },
      ],
    } as Annotation);
  };
}

export {
  getAnnotation,
  getAnnotations,
  addAnnotation,
  updateAnnotation,
  deleteAnnotation,
  createAnnotation,
  drawAnnotation,
  enableDragToMove,
};
