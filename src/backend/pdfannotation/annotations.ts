import { Annotation } from "../database";
import commentIcon from "src/assets/annotation-note.svg";

export function comment(
  container: HTMLElement,
  annot: Annotation
): HTMLElement[] {
  if (!!!annot._id) return [];
  if (annot.rects.length !== 1) return [];

  let annotationEditorLayer = container
    ?.querySelector(`div.page[data-page-number='${annot.pageNumber}']`)
    ?.querySelector(".annotationEditorLayer") as HTMLElement;

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
  section.classList.add("textAnnotation");

  let img = document.createElement("img");
  img.src = commentIcon;
  img.style.position = "absolute";
  img.style.left = "0px";
  img.style.top = "0px";
  img.draggable = false; // only the section tag to be draggable
  section.append(img);

  annotationEditorLayer.appendChild(section);

  return [section];
}

export function highlight(
  container: HTMLElement,
  annot: Annotation
): HTMLElement[] {
  if (!!!annot._id) return [];

  let annotationEditorLayer = container
    ?.querySelector(`div.page[data-page-number='${annot.pageNumber}']`)
    ?.querySelector(".annotationEditorLayer") as HTMLElement;

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
    section.className = "highlightAnnotation";
    section.style.backgroundColor = annot.color;
    section.style.mixBlendMode = "multiply";

    // put dom on the annotation layer
    annotationEditorLayer.appendChild(section);
    doms.push(section);
  }

  return doms;
}

export function rectangle(
  container: HTMLElement,
  annot: Annotation
): HTMLElement[] {
  if (!!!annot._id) return [];

  let annotationEditorLayer = container
    ?.querySelector(`div.page[data-page-number='${annot.pageNumber}']`)
    ?.querySelector(".annotationEditorLayer") as HTMLElement;

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
  section.className = "rectangleAnnotation";

  // put dom on the annotation layer
  annotationEditorLayer.appendChild(section);

  return [section];
}

export function strike(
  container: HTMLElement,
  annot: Annotation
): HTMLElement[] {
  // TODO
  return [];
}

export function underline(
  container: HTMLElement,
  annot: Annotation
): HTMLElement[] {
  if (!!!annot._id) return [];

  let annotationEditorLayer = container
    ?.querySelector(`div.page[data-page-number='${annot.pageNumber}']`)
    ?.querySelector(".annotationEditorLayer") as HTMLElement;

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
    section.className = "underlineAnnotation";

    // put dom on the annotation layer
    annotationEditorLayer.appendChild(section);
    doms.push(section);
  }

  return doms;
}
