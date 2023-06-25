import { Annotation } from "../database";

export function comment(
  container: HTMLElement,
  annot: Annotation
): HTMLElement[] {
  if (!!!annot._id) return [];
  if (annot.rects.length !== 1) return [];

  let canvasWrapper = container
    ?.querySelector(`div.page[data-page-number='${annot.pageNumber}']`)
    ?.querySelector(".canvasWrapper") as HTMLElement;

  let existed = !!canvasWrapper.querySelector(
    `section[annotation-id='${annot._id}']`
  );

  // update UI
  let section = document.createElement("section");
  section.setAttribute("annotation-id", annot._id);
  section.style.position = "absolute";
  // using percentage since it's invariant under scale change
  section.style.left = `${annot.rects[0].left}%`;
  section.style.top = `${annot.rects[0].top}%`;
  // the width and height are the same as commentIcon
  section.style.width = "40px";
  section.style.height = "40px";
  section.style.pointerEvents = "auto";
  section.style.cursor = "pointer";
  section.style.backgroundColor = annot.color;
  section.style.zIndex = "100";
  section.classList.add("textAnnotation");

  let img = document.createElement("img");
  // img.src = commentIcon;
  img.src = "annotation-note-transparent.svg";
  img.style.position = "absolute";
  img.style.left = "0px";
  img.style.top = "0px";
  img.draggable = false; // only the section tag to be draggable
  section.append(img);

  if (!existed) canvasWrapper.appendChild(section);

  return [section];
}

export function highlight(
  container: HTMLElement,
  annot: Annotation
): HTMLElement[] {
  if (!!!annot._id) return [];

  let canvasWrapper = container
    ?.querySelector(`div.page[data-page-number='${annot.pageNumber}']`)
    ?.querySelector(".canvasWrapper") as HTMLElement;

  let existed = !!canvasWrapper.querySelector(
    `section[annotation-id='${annot._id}]'`
  );

  let doms = [] as HTMLElement[];
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
    section.style.backgroundColor = annot.color;
    section.style.mixBlendMode = "multiply";
    section.style.zIndex = "100";
    section.className = "highlightAnnotation";

    // put dom on the annotation layer
    if (!existed) canvasWrapper.appendChild(section);
    doms.push(section);
  }

  return doms;
}

export function rectangle(
  container: HTMLElement,
  annot: Annotation
): HTMLElement[] {
  if (!!!annot._id) return [];

  let canvasWrapper = container
    ?.querySelector(`div.page[data-page-number='${annot.pageNumber}']`)
    ?.querySelector(".canvasWrapper") as HTMLElement;

  let existed = !!canvasWrapper.querySelector(
    `section[annotation-id='${annot._id}']`
  );

  // update UI
  let section = document.createElement("section");
  section.setAttribute("annotation-id", annot._id);
  section.style.position = "absolute";
  // using percentage since it's invariant under scale change
  section.style.left = `${annot.rects[0].left}%`;
  section.style.top = `${annot.rects[0].top}%`;
  section.style.width = `${annot.rects[0].width}%`;
  section.style.height = `${annot.rects[0].height}%`;
  section.style.pointerEvents = "auto";
  section.style.cursor = "pointer";
  section.style.backgroundColor = annot.color;
  section.style.mixBlendMode = "multiply";
  section.style.zIndex = "100";
  section.className = "rectangleAnnotation";

  // put dom on the annotation layer
  if (!existed) canvasWrapper.appendChild(section);

  return [section];
}

export function underline(
  container: HTMLElement,
  annot: Annotation
): HTMLElement[] {
  if (!!!annot._id) return [];

  let canvasWrapper = container
    ?.querySelector(`div.page[data-page-number='${annot.pageNumber}']`)
    ?.querySelector(".canvasWrapper") as HTMLElement;

  let existed = !!canvasWrapper.querySelector(
    `section[annotation-id='${annot._id}']`
  );

  let doms = [] as HTMLElement[];
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
    section.style.borderBottomStyle = "solid";
    section.style.borderBottomColor = annot.color;
    section.style.borderBottomWidth = "2px";
    section.style.zIndex = "100";

    section.className = "underlineAnnotation";

    // put dom on the annotation layer
    if (!existed) canvasWrapper.appendChild(section);
    doms.push(section);
  }

  return doms;
}

export function strikeout(
  container: HTMLElement,
  annot: Annotation
): HTMLElement[] {
  if (!!!annot._id) return [];

  let canvasWrapper = container
    ?.querySelector(`div.page[data-page-number='${annot.pageNumber}']`)
    ?.querySelector(".canvasWrapper") as HTMLElement;

  let existed = !!canvasWrapper.querySelector(
    `section[annotation-id='${annot._id}']`
  );

  let doms = [] as HTMLElement[];
  for (let rect of annot.rects) {
    // update UI
    let section = document.createElement("section");
    section.setAttribute("annotation-id", annot._id);
    section.style.position = "absolute";
    // using percentage since it's invariant under scale change
    section.style.left = `${rect.left}%`;
    section.style.top = `${rect.top}%`;
    section.style.width = `${rect.width}%`;
    section.style.height = `${rect.height / 2}%`; // so that the bottom line is in the middle of text
    section.style.pointerEvents = "auto";
    section.style.cursor = "pointer";
    section.style.borderBottomStyle = "solid";
    section.style.borderBottomColor = annot.color;
    section.style.borderBottomWidth = "2px";
    section.style.zIndex = "100";
    section.className = "strikeoutAnnotation";

    // put dom on the annotation layer
    if (!existed) canvasWrapper.appendChild(section);
    doms.push(section);
  }

  return doms;
}
