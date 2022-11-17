function getSelectionRects() {
  let selection = window.getSelection();
  let range = selection.getRangeAt(0);
  let rects = range.getClientRects();

  let newRects = [];
  for (let rect of rects) {
    if (rect.width > 0.5 && rect.height > 0) {
      if (newRects.length == 0) {
        newRects.push({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      } else if (
        Math.abs(newRects[newRects.length - 1].top - rect.top) < rect.height
      ) {
        newRects[newRects.length - 1].width += rect.width;
      } else {
        newRects.push({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      }
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

function highlight(annotation, fromDB = false) {
  let annotationEditorLayer = document
    .querySelector(`div.page[data-page-number='${annotation.pageNumber}']`)
    .querySelector(".annotationEditorLayer");

  if (!fromDB) {
    // let rec = window.getSelection().getRangeAt(0).getBoundingClientRect();
    // // if there is selection, use the selection
    // if (rec.width > 1)
    //   annotation.rect = selectionCoordinates(rec, annotationEditorLayer);
    // else return;
    let rects = getSelectionRects();
    for (let i in rects) {
      rects[i] = selectionCoordinates(rects[i], annotationEditorLayer);
    }
    annotation.rects = rects;
  }

  let doms = [];
  for (let rect of annotation.rects) {
    // update UI
    let section = document.createElement("section");
    section.setAttribute("annotation-id", annotation.id);
    section.style.position = "absolute";
    // using percentage since it's invariant under scale change
    section.style.left = `${rect.left}%`;
    section.style.top = `${rect.top}%`;
    section.style.width = `${rect.width}%`;
    section.style.height = `${rect.height}%`;
    section.style.pointerEvents = "auto";
    section.style.cursor = "pointer";
    section.className = "highlightAnnotation";
    section.style.backgroundColor = annotation.color;
    section.style.mixBlendMode = "multiply";

    // let rect = document.createElement("div");
    // rect.style.width = "100%";
    // rect.style.height = "100%";
    // rect.style.backgroundColor = annotation.color;
    // using mixBlendMode so the highlight rect doesn't cover the text
    // rect.style.mixBlendMode = "multiply";
    // section.appendChild(rect);

    // put dom on the annotation layer
    annotationEditorLayer.appendChild(section);
    doms.push(section);
  }
  return { annotation: annotation, doms: doms };
}

export { highlight };
