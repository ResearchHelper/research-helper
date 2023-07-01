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
  section.style.zIndex = "3";
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
    section.style.zIndex = "3";
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
  section.style.zIndex = "3";
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
    section.style.zIndex = "3";

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
    section.style.zIndex = "3";
    section.className = "strikeoutAnnotation";

    // put dom on the annotation layer
    if (!existed) canvasWrapper.appendChild(section);
    doms.push(section);
  }

  return doms;
}

export function ink(container: HTMLElement, annot: Annotation): HTMLElement[] {
  // draw ink from db data
  let doms = [] as HTMLElement[];
  if (!!!annot._id) return doms;

  let annotationEditorLayer = container
    ?.querySelector(`div.page[data-page-number='${annot.pageNumber}']`)
    ?.querySelector(".annotationEditorLayer") as HTMLElement;

  let existed = !!annotationEditorLayer.querySelector(
    `section[annotation-id='${annot._id}']`
  );

  let div = document.createElement("div");
  div.classList.add("inkEditor");
  div.setAttribute("annotation-id", annot._id);
  div.setAttribute("data-editor-rotation", "0");
  div.setAttribute("aria-label", "Draw Editor");
  div.style.position = "absolute";
  div.draggable = true;
  for (let rect of annot.rects) {
    div.style.left = `${rect.left}%`;
    div.style.top = `${rect.top}%`;
    div.style.width = `${rect.width}%`;
    div.style.height = `${rect.height}%`;
    div.style.minWidth = `${
      0.001 * rect.width * annotationEditorLayer.clientWidth
    }px`;
    div.style.minHeight = `${
      0.001 * rect.height * annotationEditorLayer.clientHeight
    }px`;
    let canvas = document.createElement("canvas");
    canvas.classList.add("inkEditorCanvas");
    canvas.setAttribute("aria-label", "User-created image");
    canvas.style.visibility = "visible";
    let canvasWrapper = container
      ?.querySelector(`div.page[data-page-number='${annot.pageNumber}']`)
      ?.querySelector(".canvasWrapper") as HTMLElement;
    canvas.width = 0.01 * rect.width * canvasWrapper.clientWidth;
    canvas.height = 0.01 * rect.height * canvasWrapper.clientHeight;
    let ctx = canvas.getContext("2d");
    let img = new Image();
    img.onload = () => ctx?.drawImage(img, 0, 0);
    img.src = annot.content;
    div.append(canvas);
    if (!existed) annotationEditorLayer.appendChild(div);
    doms.push(div);
  }
  return doms;
}
