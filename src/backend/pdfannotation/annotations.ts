import { reactive } from "vue";
import {
  AnnotationData,
  AnnotationType,
  EraserType,
  PDFState,
  Rect,
  RenderEvt,
} from "../database";
import { db } from "../database";
import Konva from "konva";
import { PDFPageView } from "pdfjs-dist/web/pdf_viewer";
import { debounce } from "quasar";

/**
 * Abstract class for all annotation
 * Annotation class contains annotData and annotDoms
 */
export abstract class Annotation {
  private _data = reactive<AnnotationData>({} as AnnotationData);
  private _doms = reactive<HTMLElement[]>([]);
  hasEvtHandler: boolean;
  updateDB: (props: AnnotationData) => void;

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

  isDrawn(e: RenderEvt) {
    return !!e.source.canvas?.parentElement?.querySelector(
      `[annotation-id="${this.data._id}"]`
    );
  }

  constructor(annotData: AnnotationData) {
    this.data = annotData;
    this.hasEvtHandler = false;

    this.updateDB = debounce(this._updateDB, 1000);
  }

  /**
   * Create doms and insert into layer,
   * also add event listeners to doms
   * Child class must implement this
   */
  abstract draw(e: {
    error: Error | null;
    pageNumber: number;
    source: PDFPageView;
  }): void;

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

  /**
   * Enable drag to move annotation
   */
  enableDragToMove() {
    if (this.hasEvtHandler) return;
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

    this.hasEvtHandler = true;
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

  private async _updateDB(props: AnnotationData) {
    try {
      let annot = (await db.get(this.data._id)) as AnnotationData;
      props._rev = annot._rev;
      props.timestampModified = Date.now();
      Object.assign(annot, props);
      let result = await db.put(annot);
      annot._rev = result.rev;
      this.data = annot;
    } catch (err) {
      console.log(err);
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
    this.updateDB(props);
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
  draw(e: RenderEvt): void {
    if (this.isDrawn(e) || !this.data._id) return;

    let canvasWrapper = e.source.canvas?.parentElement as HTMLElement;
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
      canvasWrapper.appendChild(section);
      this.doms.push(section);
    }
  }
}
export class Underline extends Annotation {
  draw(e: RenderEvt): void {
    if (this.isDrawn(e) || !this.data._id) return;

    let canvasWrapper = e.source.canvas?.parentElement as HTMLElement;
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
      canvasWrapper.appendChild(section);
      this.doms.push(section);
    }
  }
}
export class Strikeout extends Annotation {
  draw(e: RenderEvt): void {
    if (this.isDrawn(e) || !this.data._id) return;

    let canvasWrapper = e.source.canvas?.parentElement as HTMLElement;
    for (let rect of this.data.rects) {
      // update UI
      let section = document.createElement("section");
      section.setAttribute("annotation-id", this.data._id);
      section.style.position = "absolute";
      // using percentage since it's invariant under scale change
      section.style.left = `${rect.left}%`;
      section.style.top = `${rect.top}%`;
      section.style.width = `${rect.width}%`;
      section.style.height = `${rect.height}%`; // so that the bottom line is in the middle of text
      section.style.pointerEvents = "auto";
      section.style.cursor = "pointer";
      section.style.zIndex = "3";
      section.className = "strikeoutAnnotation";

      let div = document.createElement("div");
      div.style.position = "relative";
      div.style.top = "0";
      div.style.left = "0";
      div.style.width = "100%";
      div.style.height = "50%";
      div.style.borderBottomStyle = "solid";
      div.style.borderBottomColor = this.data.color;
      div.style.borderBottomWidth = "2px";

      section.append(div);
      // put dom on the annotation layer
      canvasWrapper.appendChild(section);
      this.doms.push(section);
    }
  }
}
export class Rectangle extends Annotation {
  draw(e: RenderEvt): void {
    if (this.isDrawn(e) || !this.data._id) return;

    let canvasWrapper = e.source.canvas?.parentElement as HTMLElement;
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
    canvasWrapper.appendChild(section);

    this.doms.push(section);
  }
}

export class Comment extends Annotation {
  draw(e: RenderEvt): void {
    if (this.isDrawn(e) || !this.data._id) return;

    let canvasWrapper = e.source.canvas?.parentElement as HTMLElement;
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
    img.src = "annotation-note-transparent.svg";
    img.style.position = "absolute";
    img.style.left = "0px";
    img.style.top = "0px";
    img.draggable = false; // only the section tag to be draggable
    section.append(img);

    canvasWrapper.appendChild(section);

    this.doms.push(section);
  }
}

/**
 * Ink Annotation is a Canvas created by Konva
 * After draw, the drawings will be displayed on a specific page
 * The event handlers are those for drawings: freehand, eraser
 */
export class Ink extends Annotation {
  stage: Konva.Stage | undefined;
  annotationEditorLayer: HTMLDivElement | undefined;
  lines: Konva.Line[] = [];

  // for dev use
  setDrawable(isDrawable: boolean) {
    if (!this.annotationEditorLayer) return;
    this.annotationEditorLayer.style.pointerEvents = isDrawable
      ? "auto"
      : "none";
  }

  scale(view: PDFPageView) {
    if (!this.stage) return;
    this.stage.scale({ x: view.scale, y: view.scale });
    this.stage.size({
      width: view.width,
      height: view.height,
    });
  }

  draw(e: RenderEvt): void {
    // find editor layer
    this.annotationEditorLayer = e.source.annotationEditorLayer
      ?.div as HTMLDivElement;

    if (!this.annotationEditorLayer.firstChild) {
      // create konva stage in editor layer if there is none
      if (this.data.content) {
        // create stage directly from path data
        this.stage = Konva.Node.create(
          this.data.content,
          this.annotationEditorLayer
        ) as Konva.Stage;
        this.scale(e.source);
      } else {
        // if no path on this page, create a new stage
        this.stage = new Konva.Stage({
          container: this.annotationEditorLayer,
          width: e.source.width,
          height: e.source.height,
          scale: { x: e.source.scale, y: e.source.scale },
        });
        this.stage.content.style.zIndex = "2";
        let layer = new Konva.Layer();
        this.stage.add(layer);
      }
    } else {
      this.scale(e.source);
    }
  }

  bindEventHandlers(state: PDFState) {
    if (!this.stage || this.hasEvtHandler) return;
    // used to determine if user if pressing button
    let isPressed: boolean;
    // make all lines removable by stroke eraser
    this.stage.find("Line").forEach((line) => {
      line.on("mouseover touchover", (e) => {
        if (
          state.tool === AnnotationType.ERASER &&
          state.eraserType === EraserType.STROKE &&
          isPressed
        )
          line.remove();
      });
    });
    // core event handlers for freedrawing
    this.stage.on("pointerdown", (e) => {
      if (!this.stage) return;
      isPressed = true;
      let pos = this.stage.getRelativePointerPosition();
      if (!pos) return;
      if (
        !(
          state.tool === AnnotationType.ERASER &&
          state.eraserType == EraserType.STROKE
        )
      ) {
        // draw line for normal pen or pixel eraser
        let line = new Konva.Line({
          stroke: state.color,
          strokeWidth:
            state.tool === AnnotationType.INK
              ? state.inkThickness
              : state.eraserThickness,
          opacity: state.tool === AnnotationType.INK ? state.inkOpacity : 1,
          globalCompositeOperation:
            state.tool === AnnotationType.INK
              ? "source-over"
              : "destination-out",
          lineCap: "round",
          lineJoin: "round",
          shadowEnabled: false,
        });
        this.stage.getLayers()[0].add(line);
        this.lines.push(line);
        if (state.tool === AnnotationType.INK) {
          // make the line removable after drawn
          line.on("pointermove", () => {
            if (
              state.tool === AnnotationType.ERASER &&
              state.eraserType === EraserType.STROKE &&
              isPressed
            )
              line.remove();
          });
        }
      }
    });
    this.stage.on("pointermove", (e) => {
      if (!this.stage || !isPressed) return;
      // prevent scrolling on touch devices
      e.evt.preventDefault();
      if (
        state.tool !== AnnotationType.INK &&
        !(
          state.tool === AnnotationType.ERASER &&
          state.eraserType === EraserType.PIXEL
        )
      )
        return;
      const pos = this.stage.getRelativePointerPosition();
      if (!pos) return;
      let lastLine = this.lines.slice(-1)[0];
      let newPoints = lastLine.points().concat([pos.x, pos.y]);
      lastLine.points(newPoints);
    });
    this.stage.on("pointerup", () => {
      isPressed = false;
      if (!this.stage) return;
      let content = this.stage.toJSON();
      this.update({ content: content } as AnnotationData);
    });
    // set this to true to prevent repeatly binding
    this.hasEvtHandler = true;
  }
}
