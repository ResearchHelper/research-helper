import { Annotation } from "../database";
import { drawRectsOnCanvas } from "./utils";

export function comment(
  container: HTMLElement,
  annot: Annotation
): HTMLElement[] {
  if (!!!annot._id) return [];
  if (annot.rects.length !== 1) return [];

  let annotationLayer = container
    ?.querySelector(`div.page[data-page-number='${annot.pageNumber}']`)
    ?.querySelector(".annotationLayer") as HTMLElement;

  if (annotationLayer === null) return [];
  let existed = !!annotationLayer.querySelector(
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

  if (!existed) annotationLayer.appendChild(section);

  return [section];
}

export function highlight(
  container: HTMLElement,
  annot: Annotation
): HTMLElement[] {
  let doms = [] as HTMLElement[];
  if (!!!annot._id) return doms;

  // draw on canvas
  let canvas = container
    ?.querySelector(`div.page[data-page-number='${annot.pageNumber}']`)
    ?.querySelector(".canvasWrapper")
    ?.querySelector("canvas") as HTMLCanvasElement;
  if (canvas === null) return doms;
  let ctx = canvas.getContext("2d");
  if (ctx === null) return doms;
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = annot.color;
  for (let rect of annot.rects) {
    ctx.fillRect(
      (rect.left / 100) * canvas.width,
      (rect.top / 100) * canvas.height,
      (rect.width / 100) * canvas.width,
      (rect.height / 100) * canvas.height
    );
  }

  // insert interacting div into annotationLayer
  let annotationLayer = container
    ?.querySelector(`div.page[data-page-number='${annot.pageNumber}']`)
    ?.querySelector(".annotationLayer") as HTMLElement;

  let existed = !!annotationLayer.querySelector(
    `section[annotation-id='${annot._id}']`
  );

  if (existed) return doms;

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
    // section.style.backgroundColor = annot.color;
    // section.style.mixBlendMode = "multiply";
    section.style.zIndex = "100";
    section.className = "highlightAnnotation";

    // put dom on the annotation layer
    annotationLayer.appendChild(section);
    doms.push(section);
  }

  return doms;
}

export function rectangle(
  container: HTMLElement,
  annot: Annotation
): HTMLElement[] {
  let doms = [] as HTMLElement[];
  if (!!!annot._id) return doms;

  // draw on canvas
  let canvas = container
    ?.querySelector(`div.page[data-page-number='${annot.pageNumber}']`)
    ?.querySelector(".canvasWrapper")
    ?.querySelector("canvas") as HTMLCanvasElement;
  if (canvas === null) return doms;
  let ctx = canvas.getContext("2d");
  if (ctx === null) return doms;
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = annot.color;
  for (let rect of annot.rects) {
    ctx.fillRect(
      (rect.left / 100) * canvas.width,
      (rect.top / 100) * canvas.height,
      (rect.width / 100) * canvas.width,
      (rect.height / 100) * canvas.height
    );
  }

  // insert interacting div into annotationLayer
  let annotationLayer = container
    ?.querySelector(`div.page[data-page-number='${annot.pageNumber}']`)
    ?.querySelector(".annotationLayer") as HTMLElement;

  let existed = !!annotationLayer.querySelector(
    `section[annotation-id='${annot._id}']`
  );

  if (existed) return doms; // update UI
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
    section.style.zIndex = "100";
    section.className = "rectangleAnnotation";

    // put dom on the annotation layer
    annotationLayer.appendChild(section);
    doms.push(section);
  }

  return doms;
}

export function underline(
  container: HTMLElement,
  annot: Annotation
): HTMLElement[] {
  let doms = [] as HTMLElement[];
  if (!!!annot._id) return doms;

  // draw on canvas
  let canvas = container
    ?.querySelector(`div.page[data-page-number='${annot.pageNumber}']`)
    ?.querySelector(".canvasWrapper")
    ?.querySelector("canvas") as HTMLCanvasElement;
  if (canvas === null) return doms;
  let ctx = canvas.getContext("2d");
  if (ctx === null) return doms;
  ctx.strokeStyle = annot.color;
  ctx.lineWidth = 2;
  for (let rect of annot.rects) {
    ctx.beginPath();
    ctx.moveTo(
      (rect.left / 100) * canvas.width,
      ((rect.top + rect.height) / 100) * canvas.height
    );
    ctx.lineTo(
      ((rect.left + rect.width) / 100) * canvas.width,
      ((rect.top + rect.height) / 100) * canvas.height
    );
    ctx.stroke();
  }

  // insert interacting div into annotationLayer
  let annotationLayer = container
    ?.querySelector(`div.page[data-page-number='${annot.pageNumber}']`)
    ?.querySelector(".annotationLayer") as HTMLElement;

  let existed = !!annotationLayer.querySelector(
    `section[annotation-id='${annot._id}']`
  );

  if (existed) return doms;
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
    section.style.zIndex = "100";

    section.className = "underlineAnnotation";

    // put dom on the annotation layer
    annotationLayer.appendChild(section);
    doms.push(section);
  }

  return doms;
}

export function strikeout(
  container: HTMLElement,
  annot: Annotation
): HTMLElement[] {
  let doms = [] as HTMLElement[];
  if (!!!annot._id) return doms;

  // draw on canvas
  let canvas = container
    ?.querySelector(`div.page[data-page-number='${annot.pageNumber}']`)
    ?.querySelector(".canvasWrapper")
    ?.querySelector("canvas") as HTMLCanvasElement;
  if (canvas === null) return doms;
  let ctx = canvas.getContext("2d");
  if (ctx === null) return doms;
  ctx.strokeStyle = annot.color;
  ctx.lineWidth = 2;
  for (let rect of annot.rects) {
    ctx.beginPath();
    ctx.moveTo(
      (rect.left / 100) * canvas.width,
      ((rect.top + rect.height / 2) / 100) * canvas.height
    );
    ctx.lineTo(
      ((rect.left + rect.width) / 100) * canvas.width,
      ((rect.top + rect.height / 2) / 100) * canvas.height
    );
    ctx.stroke();
  }

  // insert interacting div into annotationLayer
  let annotationLayer = container
    ?.querySelector(`div.page[data-page-number='${annot.pageNumber}']`)
    ?.querySelector(".annotationLayer") as HTMLElement;

  let existed = !!annotationLayer.querySelector(
    `section[annotation-id='${annot._id}']`
  );

  if (existed) return doms;
  for (let rect of annot.rects) {
    // update UI
    let section = document.createElement("section");
    section.setAttribute("annotation-id", annot._id);
    section.style.position = "absolute";
    // using percentage since it's invariant under scale change
    section.style.left = `${rect.left}%`;
    section.style.top = `${rect.top}%`;
    section.style.width = `${rect.width}%`;
    section.style.height = `${rect.height}%`; // so that the bottom line is in the middle of text
    section.style.pointerEvents = "auto";
    section.style.cursor = "pointer";
    section.style.zIndex = "100";
    section.className = "strikeoutAnnotation";

    // put dom on the annotation layer
    if (!existed) annotationLayer.appendChild(section);
    doms.push(section);
  }

  return doms;
}
