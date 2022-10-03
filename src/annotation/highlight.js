function selectionCoordinates(rect, pdfViewer) {
  let ost = computePageOffset(pdfViewer);
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

function computePageOffset(pdfViewer) {
  let pg = document
    .querySelector(
      `div.page[data-page-number='${pdfViewer.currentPageNumber}']`
    )
    .querySelector(".annotationLayer");

  var rect = pg.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

function highlight(annotation, pdfViewer, fromDB = false) {
  if (!fromDB) {
    let rec = window.getSelection().getRangeAt(0).getBoundingClientRect();
    // if there is selection, use the selection
    if (rec.width > 1) annotation.rect = selectionCoordinates(rec, pdfViewer);
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
  section.style.background = "yellow";
  // using mixBlendMode so the highlight rect doesn't cover the text
  section.style.mixBlendMode = "multiply";
  // section.style.cursor = "pointer";
  section.style.pointerEvents = "auto";
  section.className = "highlightAnnotation";

  document
    .querySelector(
      `div.page[data-page-number='${pdfViewer.currentPageNumber}']`
    )
    .querySelector(".annotationLayer")
    .appendChild(section);

  return { annotation: annotation, dom: section };
}

export { highlight };
