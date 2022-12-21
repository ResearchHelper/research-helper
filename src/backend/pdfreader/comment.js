function clickCoordinates(rect, annotationLayer) {
  let ost = computePageOffset(annotationLayer);
  let x_1 = rect.left - ost.left;
  let y_1 = rect.top - ost.top;
  // calculate the rect on UI (using percentage since it's invariant under scale change)
  return {
    left: (x_1 / ost.width) * 100,
    top: (y_1 / ost.height) * 100,
    width: rect.width,
    height: rect.height,
  };
}

function computePageOffset(annotationLayer) {
  let rect = annotationLayer.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

function comment(container, annot, fromDB = false) {
  let annotationEditorLayer = container
    .querySelector(`div.page[data-page-number='${annot.pageNumber}']`)
    .querySelector(".annotationEditorLayer");
  // let pdfViewer = annotClass.pdfViewer;
  if (!fromDB) annot.rect = clickCoordinates(annot.rect, annotationEditorLayer);

  // update UI
  let section = document.createElement("section");
  section.setAttribute("annotation-id", annot._id);
  section.style.position = "absolute";
  // using percentage since it's invariant under scale change
  section.style.left = `${annot.rect.left}%`;
  section.style.top = `${annot.rect.top}%`;
  section.style.width = `${annot.rect.width}px`;
  section.style.height = `${annot.rect.height}px`;
  section.style.pointerEvents = "auto";
  section.style.cursor = "pointer";
  // section.style.pointerEvents = "visible";
  section.classList.add("textAnnotation");

  let img = document.createElement("img");
  img.src = "src/assets/annotation-note.svg";
  img.style.position = "absolute";
  img.style.left = `0px`;
  img.style.top = `0px`;

  section.append(img);

  annotationEditorLayer.appendChild(section);

  return { annot: annot, doms: [section] };
}

export { comment };
