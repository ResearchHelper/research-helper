function getSelectionRects() {
  let selection = window.getSelection();
  let range = selection.getRangeAt(0);
  // convert DOMRectList to Array since we need filter function
  let rects = Array.from(range.getClientRects());

  // remove invalid selection
  rects = rects.filter((rect) => {
    return rect.width > 0.5 && rect.height > 0;
  });

  // remove repeated rectangles
  let left = null;
  let top = null;
  let dx = 0;
  let dy = 0;
  let prvRectWidth = null;
  rects = rects.filter((rect) => {
    dx = Math.abs(rect.left - left); // Number-null = Number
    dy = Math.abs(rect.top - top);
    left = rect.left;
    top = rect.top;
    return dx > prvRectWidth / 2 || dy > rect.height / 2;
  });

  // TODO: we can make it more robust, do this later
  // join rectangles
  let newRects = [];
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

function selectionCoordinates(rect, annotationLayer) {
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

function computePageOffset(annotationLayer) {
  var rect = annotationLayer.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

function highlight(container, annot, fromDB = false) {
  let annotationEditorLayer = container
    .querySelector(`div.page[data-page-number='${annot.pageNumber}']`)
    .querySelector(".annotationEditorLayer");

  if (!fromDB) {
    let rects = getSelectionRects();
    for (let i in rects) {
      rects[i] = selectionCoordinates(rects[i], annotationEditorLayer);
    }
    annot.rects = rects;
  }

  let doms = [];
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
    section.className = "highlightAnnotation";
    section.style.backgroundColor = annot.color;
    section.style.mixBlendMode = "multiply";

    // put dom on the annotation layer
    annotationEditorLayer.appendChild(section);
    doms.push(section);
  }
  return { annot: annot, doms: doms };
}

export { highlight };
