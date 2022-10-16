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

function createContextMenu(dom, annotClass) {
  let div = document.createElement("div");
  div.style.position = "relative";
  div.style.left = "50%";
  div.style.top = "5%";
  div.style.backgroundColor = "#1D1D1D";
  div.style.mixBlendMode = "unset !important";
  div.hidden = true;

  let addComment = document.createElement("div");
  addComment.innerHTML = "Add Comment";
  let deleteAnnot = document.createElement("div");
  deleteAnnot.innerHTML = "Delete";
  deleteAnnot.onclick = (annotClass) => {
    annotClass.deleteAnnotation(dom.id);
  };
  let changeColor = document.createElement("div");
  changeColor.innerHTML = "changeColor";

  div.append(addComment, deleteAnnot, changeColor);
  dom.appendChild(div);

  // create contextMenu
  dom.onclick = (ev) => {
    div.hidden = false;
    console.log(annotClass);
    document.onclick = (e) => {
      if (!dom.contains(e.target)) {
        // if clicked outside, close the menu
        div.hidden = true;
        document.onclick = null;
      } else {
        console.log(ev);
      }
    };
  };
}

function highlight(annotation, annotClass, fromDB = false) {
  let pdfViewer = annotClass.pdfViewer;
  if (!fromDB) {
    let rec = window.getSelection().getRangeAt(0).getBoundingClientRect();
    // if there is selection, use the selection
    if (rec.width > 1) annotation.rect = selectionCoordinates(rec, pdfViewer);
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

  // createContextMenu(section, annotClass);
  document
    .querySelector(
      `div.page[data-page-number='${pdfViewer.currentPageNumber}']`
    )
    .querySelector(".annotationLayer")
    .appendChild(section);

  return { annotation: annotation, dom: section };
}

export { highlight };
