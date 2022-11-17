function clickCoordinates(rect, annotationLayer) {
  let ost = computePageOffset(annotationLayer);
  let x_1 = rect.left - ost.left;
  let y_1 = rect.top - ost.top;
  // calculate the rect on UI (using percentage since it's invariant under scale change)
  return {
    left: (x_1 / ost.width) * 100,
    top: (y_1 / ost.height) * 100,
    width: 5,
    height: 5,
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

function comment(annotation, fromDB = false) {
  let annotationEditorLayer = document
    .querySelector(`div.page[data-page-number='${annotation.pageNumber}']`)
    .querySelector(".annotationEditorLayer");
  // let pdfViewer = annotClass.pdfViewer;
  if (!fromDB)
    annotation.rect = clickCoordinates(annotation.rect, annotationEditorLayer);

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
  section.style.cursor = "pointer";
  // section.style.pointerEvents = "visible";
  section.classList.add("textAnnotation");

  // let popupWrapper = document.createElement("div");
  // popupWrapper.classList.add("popupWrapper");
  // popupWrapper.style.left = "100%";

  // let popup = document.createElement("div");
  // popup.classList.add("popup");

  // let editorArea = document.createElement("div");
  // editorArea.classList.add("editorArea");

  // let buttonArea = document.createElement("div");
  // buttonArea.classList.add("buttonArea");

  let img = document.createElement("img");
  img.src = "src/assets/annotation-note.svg";
  img.style.position = "absolute";

  section.append(img);

  // popup.append(h1, span, p); // This is not so right, should hide when cursor is not on the note
  // popup.hidden = true;
  // popupWrapper.append(popup);
  // section.append(popupWrapper, img);

  // img.addEventListener("click", (e) => {
  //   popup.hidden = !popup.hidden;
  // });

  annotationEditorLayer.appendChild(section);

  return { annotation: annotation, dom: section };
}

export { comment };
