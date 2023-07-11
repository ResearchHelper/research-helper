import { reactive } from "vue";
import { AnnotationData, AnnotationType, PDFState, Rect } from "../database";
import { db } from "../database";

/**
 * Abstract class for all annotation
 * Annotation class contains annotData and annotDoms
 */
export abstract class Annotation {
  private _data = reactive<AnnotationData>({} as AnnotationData);
  private _doms = reactive<HTMLElement[]>([]);
  container: HTMLElement;

  get data() {
    return this._data;
  }

  set data(annotData: AnnotationData) {
    Object.assign(this._data, annotData);
  }

  get doms() {
    return this._doms;
  }

  set doms(annotDoms: HTMLElement[]) {
    Object.assign(this._doms, annotDoms);
  }

  constructor(annotData: AnnotationData, container: HTMLElement) {
    this.data = annotData;
    this.container = container;
  }

  /**
   * Create doms and insert into layer,
   * also add event listeners to doms
   * Child class must implement this
   */
  abstract draw(): void;

  undraw() {
    for (let dom of this.doms) dom.remove();
    this.doms = [];
  }

  setActive(isActive: boolean) {
    for (let dom of this.doms) {
      if (isActive) dom.classList.add("activeAnnotation");
      else dom.classList.remove("activeAnnotation");
    }
  }

  scrollIntoView() {}

  /**
   * Enable drag to move annotation
   */
  enableDragToMove() {
    // we assume the draggable annotations are: comment, rectangle
    // these annotations only have 1 dom
    if (this.doms.length != 1) return;
    let dom = this.doms[0];
    let annotLayerRect: Rect;
    let domRect: Rect;
    let offsetX = 0;
    let offsetY = 0;
    let shiftX = 0;
    let shiftY = 0;
    let left: number;
    let top: number;
    let tmpLeft: number;
    let tmpTop: number;

    dom.draggable = true;
    dom.ondragstart = (e) => {
      annotLayerRect = dom.parentElement?.getBoundingClientRect() as Rect;
      domRect = dom.getBoundingClientRect();
      offsetX = annotLayerRect.left;
      offsetY = annotLayerRect.top;
      shiftX = e.clientX - domRect.left;
      shiftY = e.clientY - domRect.top;
    };

    dom.ondrag = (e) => {
      // when drag is released, e.pageX and e.pageY will jump to 0, weird
      // need to calculate tmpLeft/tmpTop first to avoid this
      tmpLeft = e.pageX - offsetX - shiftX;
      tmpTop = e.pageY - offsetY - shiftY;

      if (tmpLeft < 0 || tmpLeft + domRect.width > annotLayerRect.width) return;
      if (tmpTop < 0 || tmpTop + domRect.height > annotLayerRect.height) return;

      left = (tmpLeft / annotLayerRect.width) * 100;
      top = (tmpTop / annotLayerRect.height) * 100;

      dom.style.left = `${left}%`;
      dom.style.top = `${top}%`;
    };

    dom.ondragend = (e) => {
      // left and top are in percentage
      // width and height are in px
      this.update({
        rects: [
          {
            left: left,
            top: top,
            width: parseFloat(dom.style.width),
            height: parseFloat(dom.style.height),
          },
        ],
      } as AnnotationData);
    };
  }

  /**
   * Save annotation to databse
   */
  async save() {
    try {
      await db.put(this.data);
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Update annotation doms and data in database
   */
  async update(props: AnnotationData) {
    // update ui
    for (let dom of this.doms) {
      if (props.color) {
        if (
          this.data.type === AnnotationType.UNDERLINE ||
          this.data.type === AnnotationType.STRIKEOUT
        )
          dom.style.borderBottomColor = props.color;
        else dom.style.background = props.color;
      }
    }

    // update db
    try {
      let annot = (await db.get(this.data._id)) as AnnotationData;
      props._rev = annot._rev;
      Object.assign(annot, props);
      let result = await db.put(annot);
      annot._rev = result.rev;
      this.data = annot;
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * Delete annotation doms and data from database
   */
  async delete() {
    // update ui
    for (let dom of this.doms) dom.remove();

    // update db
    try {
      let annot = await db.get(this.data._id);
      await db.remove(annot);
    } catch (error) {
      console.log(error);
    }
  }
}

export class Highlight extends Annotation {
  draw(): void {
    if (!this.data._id) this.doms = [];

    let canvasWrapper = this.container
      ?.querySelector(`div.page[data-page-number='${this.data.pageNumber}']`)
      ?.querySelector(".canvasWrapper") as HTMLElement;

    let existed = !!canvasWrapper.querySelector(
      `section[annotation-id='${this.data._id}]'`
    );

    let doms = [] as HTMLElement[];
    for (let rect of this.data.rects) {
      // update UI
      let section = document.createElement("section");
      section.setAttribute("annotation-id", this.data._id);
      section.style.position = "absolute";
      // using percentage since it's invariant under scale change
      section.style.left = `${rect.left}%`;
      section.style.top = `${rect.top}%`;
      section.style.width = `${rect.width}%`;
      section.style.height = `${rect.height}%`;
      section.style.pointerEvents = "auto";
      section.style.cursor = "pointer";
      section.style.backgroundColor = this.data.color;
      section.style.mixBlendMode = "multiply";
      section.style.zIndex = "3";
      section.className = "highlightAnnotation";

      // put dom on the annotation layer
      if (!existed) canvasWrapper.appendChild(section);
      doms.push(section);
    }

    this.doms = doms;
  }
}
export class Underline extends Annotation {
  draw(): void {
    if (!this.data._id) this.doms = [];

    let canvasWrapper = this.container
      ?.querySelector(`div.page[data-page-number='${this.data.pageNumber}']`)
      ?.querySelector(".canvasWrapper") as HTMLElement;

    let existed = !!canvasWrapper.querySelector(
      `section[annotation-id='${this.data._id}']`
    );

    let doms = [] as HTMLElement[];
    for (let rect of this.data.rects) {
      // update UI
      let section = document.createElement("section");
      section.setAttribute("annotation-id", this.data._id);
      section.style.position = "absolute";
      // using percentage since it's invariant under scale change
      section.style.left = `${rect.left}%`;
      section.style.top = `${rect.top}%`;
      section.style.width = `${rect.width}%`;
      section.style.height = `${rect.height}%`;
      section.style.pointerEvents = "auto";
      section.style.cursor = "pointer";
      section.style.borderBottomStyle = "solid";
      section.style.borderBottomColor = this.data.color;
      section.style.borderBottomWidth = "2px";
      section.style.zIndex = "3";

      section.classList.add("underlineAnnotation");

      // put dom on the annotation layer
      if (!existed) canvasWrapper.appendChild(section);
      doms.push(section);
    }
    this.doms = doms;
  }
}
export class Strikeout extends Annotation {
  draw(): void {
    if (!this.data._id) this.doms = [];

    let canvasWrapper = this.container
      ?.querySelector(`div.page[data-page-number='${this.data.pageNumber}']`)
      ?.querySelector(".canvasWrapper") as HTMLElement;

    let existed = !!canvasWrapper.querySelector(
      `section[annotation-id='${this.data._id}']`
    );

    let doms = [] as HTMLElement[];
    for (let rect of this.data.rects) {
      // update UI
      let section = document.createElement("section");
      section.setAttribute("annotation-id", this.data._id);
      section.style.position = "absolute";
      // using percentage since it's invariant under scale change
      section.style.left = `${rect.left}%`;
      section.style.top = `${rect.top}%`;
      section.style.width = `${rect.width}%`;
      section.style.height = `${rect.height / 2}%`; // so that the bottom line is in the middle of text
      section.style.pointerEvents = "auto";
      section.style.cursor = "pointer";
      section.style.borderBottomStyle = "solid";
      section.style.borderBottomColor = this.data.color;
      section.style.borderBottomWidth = "2px";
      section.style.zIndex = "3";
      section.className = "strikeoutAnnotation";

      // put dom on the annotation layer
      if (!existed) canvasWrapper.appendChild(section);
      doms.push(section);
    }

    this.doms = doms;
  }
}
export class Rectangle extends Annotation {
  draw(): void {
    if (!this.data._id) this.doms = [];

    let canvasWrapper = this.container
      ?.querySelector(`div.page[data-page-number='${this.data.pageNumber}']`)
      ?.querySelector(".canvasWrapper") as HTMLElement;

    let existed = !!canvasWrapper.querySelector(
      `section[annotation-id='${this.data._id}']`
    );

    // update UI
    let section = document.createElement("section");
    section.setAttribute("annotation-id", this.data._id);
    section.style.position = "absolute";
    // using percentage since it's invariant under scale change
    section.style.left = `${this.data.rects[0].left}%`;
    section.style.top = `${this.data.rects[0].top}%`;
    section.style.width = `${this.data.rects[0].width}%`;
    section.style.height = `${this.data.rects[0].height}%`;
    section.style.pointerEvents = "auto";
    section.style.cursor = "pointer";
    section.style.backgroundColor = this.data.color;
    section.style.mixBlendMode = "multiply";
    section.style.zIndex = "3";
    section.classList.add("rectangleAnnotation");

    // put dom on the annotation layer
    if (!existed) canvasWrapper.appendChild(section);

    this.doms = [section];
  }
}

export class Comment extends Annotation {
  draw(): void {
    if (!this.data._id) this.doms = [];
    if (this.data.rects.length !== 1) this.doms = [];

    let canvasWrapper = this.container
      ?.querySelector(`div.page[data-page-number='${this.data.pageNumber}']`)
      ?.querySelector(".canvasWrapper") as HTMLElement;

    let existed = !!canvasWrapper.querySelector(
      `section[annotation-id='${this.data._id}']`
    );

    // update UI
    let section = document.createElement("section");
    section.setAttribute("annotation-id", this.data._id);
    section.style.position = "absolute";
    // using percentage since it's invariant under scale change
    section.style.left = `${this.data.rects[0].left}%`;
    section.style.top = `${this.data.rects[0].top}%`;
    // the width and height are the same as commentIcon
    section.style.width = "40px";
    section.style.height = "40px";
    section.style.pointerEvents = "auto";
    section.style.cursor = "pointer";
    section.style.backgroundColor = this.data.color;
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

    this.doms = [section];
  }
}
export class Ink extends Annotation {
  draw(): void {
    // draw ink from db data
    let doms = [] as HTMLElement[];
    if (!this.data._id) this.doms = doms;

    let annotationEditorLayer = this.container
      ?.querySelector(`div.page[data-page-number='${this.data.pageNumber}']`)
      ?.querySelector(".annotationEditorLayer") as HTMLElement;

    let existed = !!annotationEditorLayer.querySelector(
      `section[annotation-id='${this.data._id}']`
    );

    let div = document.createElement("div");
    div.classList.add("inkEditor");
    div.setAttribute("annotation-id", this.data._id);
    div.setAttribute("data-editor-rotation", "0");
    div.setAttribute("aria-label", "Draw Editor");
    div.style.position = "absolute";
    div.draggable = true;
    for (let rect of this.data.rects) {
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
      let canvasWrapper = this.container
        ?.querySelector(`div.page[data-page-number='${this.data.pageNumber}']`)
        ?.querySelector(".canvasWrapper") as HTMLElement;
      canvas.width = 0.01 * rect.width * canvasWrapper.clientWidth;
      canvas.height = 0.01 * rect.height * canvasWrapper.clientHeight;
      let ctx = canvas.getContext("2d");
      let img = new Image();
      img.onload = () => ctx?.drawImage(img, 0, 0);
      img.src = this.data.content;
      div.append(canvas);
      if (!existed) annotationEditorLayer.appendChild(div);
      doms.push(div);
    }
    this.doms = doms;
  }
}
