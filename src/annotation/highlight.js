// FIXME: for two page view the coordinate is not right,
// additional 100% is in the horizontal coordinates
function selectionCoordinates(rect, annotationLayer) {
  let ost = computePageOffset(annotationLayer);
  let x_1 = rect.x - ost.left;
  let y_1 = rect.y - ost.top;
  // calculate the rectt on UI (using percentage since it's invariant under scale change)
  return {
    left: (x_1 / ost.width) * 100,
    top: (y_1 / ost.height) * 100,
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
  let annotationLayer = document
    .querySelector(`div.page[data-page-number='${annotation.pageNumber}']`)
    .querySelector(".annotationLayer");

  if (!fromDB) {
    let rec = window.getSelection().getRangeAt(0).getBoundingClientRect();
    // if there is selection, use the selection
    if (rec.width > 1)
      annotation.rect = selectionCoordinates(rec, annotationLayer);
    else return;
  }

  // update UI
  let section = document.createElement("section");
  section.setAttribute("id", annotation.id);
  section.style.position = "absolute";
  // using percentage since it's invariant under scale change
  section.style.left = `${annotation.rect.left}%`;
  section.style.top = `${annotation.rect.top}%`;
  section.style.width = `${annotation.rect.width}%`;
  section.style.height = `${annotation.rect.height}%`;
  section.style.pointerEvents = "auto";
  section.className = "highlightAnnotation";

  let rect = document.createElement("div");
  rect.style.width = "100%";
  rect.style.height = "100%";
  rect.style.backgroundColor = annotation.color;
  // using mixBlendMode so the highlight rect doesn't cover the text
  rect.style.mixBlendMode = "multiply";
  section.appendChild(rect);

  // put dom on the annotation layer
  annotationLayer.appendChild(section);
  return { annotation: annotation, dom: section };
}

export { highlight };
