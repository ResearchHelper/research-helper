function clickCoordinates(rect, pdfViewer) {
  let ost = computePageOffset(pdfViewer);
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

function computePageOffset(pdfViewer) {
  let pg = document
    .querySelector(
      `div.page[data-page-number='${pdfViewer.currentPageNumber}']`
    )
    .querySelector(".annotationLayer");

  let rect = pg.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

function comment(annotation, annotClass, fromDB = false) {
  let pdfViewer = annotClass.pdfViewer;
  if (!fromDB) annotation.rect = clickCoordinates(annotation.rect, pdfViewer);

  // update UI
  let section = document.createElement("section");
  section.setAttribute("id", annotation.id);
  // using percentage since it's invariant under scale change
  section.style.left = `${annotation.rect.left}%`;
  section.style.top = `${annotation.rect.top}%`;
  section.style.width = `${annotation.rect.width}%`;
  section.style.height = `${annotation.rect.height}%`;
  // section.style.cursor = "pointer";
  // section.style.pointerEvents = "visible";
  section.classList.add("textAnnotation");

  let popupWrapper = document.createElement("div");
  popupWrapper.classList.add("popupWrapper");
  popupWrapper.style.left = "100%";

  let popup = document.createElement("div");
  popup.classList.add("popup");

  let h1 = document.createElement("h1");
  h1.innerHTML = "Hunt";

  let span = document.createElement("span");
  span.classList.add("popupData");
  span.innerText = "2022/10/2";

  let p = document.createElement("p");
  p.classList.add("popupContent");
  p.innerHTML = "Hello world";

  let img = document.createElement("img");
  img.src = "node_modules/pdfjs-dist/web/images/annotation-note.svg";

  popup.append(h1, span, p); // This is not so right, should hide when cursor is not on the note
  popup.hidden = true;
  popupWrapper.append(popup);
  section.append(popupWrapper, img);

  section.addEventListener("click", (e) => {
    popup.hidden = !popup.hidden;
  });

  document
    .querySelector(
      `div.page[data-page-number='${pdfViewer.currentPageNumber}']`
    )
    .querySelector(".annotationLayer")
    .appendChild(section);

  return { annotation: annotation, dom: section };
}

export { comment };
