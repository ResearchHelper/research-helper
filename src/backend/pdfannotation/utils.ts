import { Annotation, Rect } from "../database";

/**
 * Get user selected rects
 * @returns selection rectangles
 */
function getSelectionRects(): Rect[] {
  let selection = window.getSelection();
  if (!!!selection) return [];
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

function offsetTransform(rect: Rect, annotationLayer: HTMLElement) {
  let ost = computePageOffset(annotationLayer);
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

function computePageOffset(annotationLayer: HTMLElement): Rect {
  let rect = annotationLayer.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  } as Rect;
}

function drawRectsOnCanvas(canvas: HTMLCanvasElement, annot: Annotation) {
  let success = true;
  if (canvas === null) return !success;
  let ctx = canvas.getContext("2d");
  if (ctx === null) return !success;
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = annot.color;
  for (let rect of annot.rects) {
    ctx.fillRect(
      (rect.left / 100) * canvas.width,
      (rect.top / 100) * canvas.height,
      (rect.width / 100) * canvas.width,
      (rect.height / 100) * canvas.height
    );
  }
  return success;
}

function insertRectsToAnnotLayer(
  annotationLayer: HTMLElement,
  annot: Annotation
) {
  let doms = [] as HTMLElement[];

  let existed = !!annotationLayer.querySelector(
    `section[annotation-id='${annot._id}']`
  );

  if (existed) return doms;

  for (let rect of annot.rects) {
    // update UI
    let section = document.createElement("section");
    section.setAttribute("annotation-id", annot._id);
    section.style.position = "absolute";
    // using percentage since it's invariant under scale change
    section.style.left = `${rect.left}%`;
    section.style.top = `${rect.top}%`;
    section.style.width = `${rect.width}%`;
    section.style.height = `${rect.height}%`;
    section.style.pointerEvents = "auto";
    section.style.cursor = "pointer";
    section.style.zIndex = "100";
    section.className = "highlightAnnotation";

    // put dom on the annotation layer
    annotationLayer.appendChild(section);
    doms.push(section);
  }

  return doms;
}

export { getSelectionRects, offsetTransform, drawRectsOnCanvas };
