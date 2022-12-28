import { ref } from "vue";
import {
  createIndex,
  getAnnotations,
  getAnnotationsByPage,
  getAnnotationById,
  addAnnotation,
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
   * add to DB and return the corresponding doms (for PDFReader UI)
   * @param {Object} rawAnnot
   * @param {Boolean} fromDB
   * @returns {Array} Array of DOMs
   */
  async create(rawAnnot, fromDB = false) {
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

  async update(id, newPropDict) {
    try {
      let annot = await getAnnotationById(id);
      for (let key in newPropDict) {
        annot[key] = newPropDict[key];
      }
      updateAnnotation(annot);

      // update PDFReader UI
      if ("color" in newPropDict) {
        for (let dom of document.querySelectorAll(
          `section[annotation-id="${id}"]`
        )) {
          dom.style.background = newPropDict.color;
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
   * Draw annots on specified page
   * @param {Number} pageNumber
   */
  async drawAnnots(pageNumber) {
    let annots = this.getAnnotsByPage(pageNumber);
    for (let annot of annots) {
      let doms = await this.create(annot, true);
      // bind function to dom
      for (let dom of doms)
        dom.onclick = () => {
          this.setActiveAnnot(dom.getAttribute("annotation-id"));
        };
    }
  }

  /**
   * Create annot on specified page and coordinate
   * @param {Number} pageNumber
   * @param {Number} clientX
   * @param {Number} clientY
   * @param {String} tool
   * @param {String} color
   */
  async createAnnot(pageNumber, clientX, clientY, tool, color) {
    let rect = null;
    if (tool == AnnotationType.COMMENT) {
      rect = {
        left: clientX,
        top: clientY,
        width: 40,
        height: 40,
      };
    }

    let doms = await this.create({
      type: tool,
      rect: rect, // only for comment annotation
      color: color,
      pageNumber: pageNumber,
    });

    if (doms.length == 0) this.setActiveAnnot("");

    for (let dom of doms) {
      dom.onclick = () => {
        this.setActiveAnnot(dom.getAttribute("annotation-id"));
      };
    }
  }

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
}

export { AnnotManager };
