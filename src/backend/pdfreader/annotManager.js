import { ref } from "vue";
import {
  getAnnotations,
  getAnnotationById,
  updateAnnotation,
  deleteAnnotation,
  createAnnotation,
  AnnotationType,
} from "src/backend/pdfreader/annotation";

class AnnotManager {
  constructor(projectId, container) {
    this.projectId = projectId;
    this.container = container;
    this.annots = [];
    this.selected = "";
  }

  /**
   * Get all annotation of the project
   * @public
   */
  async init() {
    try {
      this.annots = await getAnnotations(this.projectId);
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * Return an array of annots on specified page
   * @param {Number} pageNumber
   * @returns {Array} annots
   * @public
   */
  getAnnotsByPage(pageNumber) {
    let annots = [];
    for (let annot of this.annots) {
      if (annot.pageNumber == parseInt(pageNumber)) {
        annots.push(annot);
      }
    }
    return annots;
  }

  /**
   * Search annotation in current annot list
   * @param {String} annotId
   * @returns Annotation
   * @public
   */
  getAnnotById(annotId) {
    let target = null;
    for (let annot of this.annots) {
      if (annot._id == annotId) {
        target = annot;
        break;
      }
    }
    return target;
  }

  /**
   * Update properties of an annotation with specific id
   * @param {string} id
   * @param {Object} props
   * @public
   */
  async update(id, props) {
    try {
      let annot = await getAnnotationById(id);
      for (let key in props) {
        annot[key] = props[key];
      }
      await updateAnnotation(annot);

      // update PDFReader UI
      if ("color" in props) {
        for (let dom of document.querySelectorAll(
          `section[annotation-id="${id}"]`
        )) {
          dom.style.background = props.color;
        }
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
   * @param {string} annotId
   * @public
   */
  async delete(annotId) {
    try {
      await deleteAnnotation(annotId);
    } catch (error) {
      console.log(error);
    }

    // update PDFReader UI
    for (let dom of document.querySelectorAll(
      `section[annotation-id="${annotId}"]`
    )) {
      dom.remove();
    }

    // update AnnotationList UI
    this.annots = this.annots.filter((annot) => annot._id != annotId);
  }

  /**
   * add to DB and return the corresponding doms (for PDFReader UI)
   * @param {Object} rawAnnot
   * @param {boolean} fromDB
   * @returns {Array} Array of DOMs
   * @private
   */
  async _create(rawAnnot, fromDB = false) {
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
   * @param {number} pageNumber
   * @public
   */
  async drawAnnots(pageNumber) {
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
   * @param {number} pageNumber
   * @param {number} clientX
   * @param {number} clientY
   * @param {string} tool
   * @param {string} color
   * @public
   */
  async create(pageNumber, clientX, clientY, tool, color) {
    let rect = null;
    if (tool == AnnotationType.COMMENT) {
      rect = {
        left: clientX,
        top: clientY,
        width: 40,
        height: 40,
      };
    }

    let doms = await this._create({
      type: tool,
      rect: rect, // only for comment annotation
      color: color,
      pageNumber: pageNumber,
    });

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
   * @param {string} annotId
   */
  setActiveAnnot(annotId) {
    this.selected = annotId;

    if (!!annotId) {
      // highlight it
      let doms = this.container.querySelectorAll(
        `section[annotation-id="${annotId}"]`
      );
      for (let dom of doms) {
        dom.classList.add("activeAnnotation");
      }
    } else {
      // deselect annotation
      let doms = this.container.querySelectorAll(".activeAnnotation");
      for (let dom of doms) {
        dom.classList.remove("activeAnnotation");
      }
    }
  }

  _enableDragToMove(dom) {
    let annotLayerRect = null;
    let domRect = null;
    let offsetX = 0;
    let offsetY = 0;
    let shiftX = 0;
    let shiftY = 0;
    dom.ondragstart = (e) => {
      annotLayerRect = dom.parentElement.getBoundingClientRect();
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
      this.update(dom.getAttribute("annotation-id"), {
        rect: { left: left, top: top, width: 40, height: 40 },
      });
    };
  }
}

export { AnnotManager };
