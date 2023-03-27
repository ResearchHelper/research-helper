import {
  getAnnotations,
  getAnnotationById,
  updateAnnotation,
  deleteAnnotation,
  createAnnotation,
  AnnotationType,
} from "src/backend/pdfreader/annotation";
import { Annotation, Rect } from "../database";

class AnnotManager {
  projectId: string;
  container: HTMLElement;
  annots: Annotation[];
  selected: string | null; // selected annotId

  constructor(projectId: string, container: HTMLElement) {
    this.projectId = projectId;
    this.container = container;
    this.annots = [];
    this.selected = "";
  }

  /**
   * Get all annotation of the project
   */
  async init() {
    try {
      this.annots = (await getAnnotations(this.projectId)) as Annotation[];
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * Return an array of annots on specified page
   * @param pageNumber
   * @returns annots
   */
  getAnnotsByPage(pageNumber: number): Annotation[] {
    let annots = [];
    for (let annot of this.annots) {
      if (annot.pageNumber === pageNumber) {
        annots.push(annot);
      }
    }
    return annots;
  }

  /**
   * Search annotation in current annot list
   * @param annotId
   * @returns annot
   */
  getAnnotById(annotId: string): Annotation {
    let target = null;
    for (let annot of this.annots) {
      if (annot._id == annotId) {
        target = annot;
        break;
      }
    }
    return target as Annotation;
  }

  /**
   * Update properties of an annotation with specific id
   * @param id - annotation id
   * @param props - new properties of the annotation
   * @public
   */
  async update(id: string, props: Annotation) {
    try {
      let annot = (await getAnnotationById(id)) as Annotation;
      for (let key in props) {
        annot[key] = props[key];
      }
      await updateAnnotation(annot);

      // update PDFReader UI
      if ("color" in props) {
        document
          .querySelectorAll(`section[annotation-id="${id}"]`)
          .forEach((dom) => {
            (dom as HTMLElement).style.background = props.color;
          });
      }

      // update AnnotationList UI
      for (let i in this.annots) {
        if (this.annots[i]._id == annot._id) {
          this.annots[i] = annot;
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * Delete an annotation with specific id
   * @param annotId
   */
  async delete(annotId: string) {
    try {
      await deleteAnnotation(annotId);
    } catch (error) {
      console.log(error);
    }

    // update PDFReader UI
    document
      .querySelectorAll(`section[annotation-id="${annotId}"]`)
      .forEach((dom) => {
        dom.remove();
      });

    // update AnnotationList UI
    this.annots = this.annots.filter((annot) => annot._id != annotId);
  }

  /**
   * add to DB and return the corresponding doms (for PDFReader UI)
   * @param rawAnnot
   * @param fromDB
   * @returns Array of DOMs
   */
  private async _create(
    rawAnnot: Annotation,
    fromDB = false
  ): Promise<HTMLElement[]> {
    // update db
    rawAnnot.projectId = this.projectId;
    let result = await createAnnotation(this.container, rawAnnot, fromDB);
    if (!!!result) return []; // return empty doms if just clicking

    // update AnnotationList UI
    if (!fromDB && !!result.doms.length) {
      this.annots.push(result.annot);
    }

    return result.doms;
  }

  /**
   * Draw annots on specified page
   * @param pageNumber
   */
  async drawAnnots(pageNumber: number) {
    let annots = this.getAnnotsByPage(pageNumber);
    for (let annot of annots) {
      let doms = await this._create(annot, true);
      // bind function to dom
      for (let dom of doms) {
        dom.onclick = () => {
          this.setActiveAnnot(dom.getAttribute("annotation-id"));
        };
      }
      if (annot.type === "comment") this._enableDragToMove(doms[0]);
    }
  }

  /**
   * Create annot on specified page and coordinate
   * @param pageNumber
   * @param clientX
   * @param clientY
   * @param tool
   * @param color
   */
  async create(
    pageNumber: number,
    clientX: number,
    clientY: number,
    tool: "highlight" | "comment",
    color: string
  ) {
    let rect = null;
    if (tool == AnnotationType.COMMENT) {
      rect = {
        left: clientX,
        top: clientY,
        width: 40,
        height: 40,
      } as Rect;
    }

    let doms = await this._create({
      type: tool,
      rect: rect, // only for comment annotation
      color: color,
      pageNumber: pageNumber,
    } as Annotation);

    for (let dom of doms) {
      dom.onclick = () => {
        this.setActiveAnnot(dom.getAttribute("annotation-id"));
      };
    }

    if (tool === "comment") this._enableDragToMove(doms[0]);

    if (doms.length == 0) this.setActiveAnnot("");
    else this.setActiveAnnot(doms[0].getAttribute("annotation-id"));
  }

  /**
   * Set an annotation active
   * @param annotId
   */
  setActiveAnnot(annotId: string | null) {
    this.selected = annotId;

    if (!!annotId) {
      // highlight it
      this.container
        .querySelectorAll(`section[annotation-id="${annotId}"]`)
        .forEach((dom) => {
          dom.classList.add("activeAnnotation");
        });
    } else {
      // deselect annotation
      this.container.querySelectorAll(".activeAnnotation").forEach((dom) => {
        dom.classList.remove("activeAnnotation");
      });
    }
  }

  private _enableDragToMove(dom: HTMLElement) {
    let annotLayerRect: Rect;
    let domRect: Rect;
    let offsetX = 0;
    let offsetY = 0;
    let shiftX = 0;
    let shiftY = 0;
    dom.ondragstart = (e) => {
      annotLayerRect = dom.parentElement?.getBoundingClientRect() as Rect;
      domRect = dom.getBoundingClientRect();
      offsetX = annotLayerRect.left;
      offsetY = annotLayerRect.top;
      shiftX = e.clientX - domRect.left;
      shiftY = e.clientY - domRect.top;
    };

    dom.ondragend = (e) => {
      let left = e.pageX - offsetX - shiftX;
      let top = e.pageY - offsetY - shiftY;

      if (left < 0) left = 0;
      if (left + domRect.width > annotLayerRect.width)
        left = annotLayerRect.width - domRect.width;
      if (top < 0) top = 0;
      if (top + domRect.height > annotLayerRect.height)
        top = annotLayerRect.height - domRect.height;

      left = (left / annotLayerRect.width) * 100;
      top = (top / annotLayerRect.height) * 100;

      dom.style.left = `${left}%`;
      dom.style.top = `${top}%`;

      // left and top are in percentage
      // width and height are in px
      let id = dom.getAttribute("annotation-id");
      if (!!id) {
        this.update(id, {
          rect: { left: left, top: top, width: 40, height: 40 },
        } as Annotation);
      }
    };
  }
}

export { AnnotManager };
