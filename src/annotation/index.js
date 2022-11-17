import { highlight } from "./highlight";
import { comment } from "./comment";
import { v4 as uuidv4 } from "uuid";
import { useStateStore } from "src/stores/appState";
const stateStore = useStateStore();
const storagePath = stateStore.storagePath;
// I have to load these libraries using contextBridge, otherwise they are externalized
const path = window.path;
const fs = window.fs;

const AnnotationType = {
  NONE: "cursor",
  COMMENT: "comment",
  HIGHLIGHT: "highlight",
  FREETEXT: "freetext",
  INK: "ink",
};

class AnnotationManager {
  constructor() {
    this.folderPath = path.join(
      storagePath,
      "projects",
      stateStore.workingProject.projectId
    );
    this.annotations = {};
    this.doms = {};

    this.getAnnotations();
  }

  createAnnotation(annotation, fromDB = false) {
    if (annotation.type === AnnotationType.NONE) return;

    // give it an id
    if (!annotation.id) annotation.id = uuidv4();

    // create annotation and push to ui
    let result = null;
    let type = annotation.type;
    switch (type) {
      case AnnotationType.HIGHLIGHT:
        result = highlight(annotation, fromDB);
        break;
      case AnnotationType.COMMENT:
        result = comment(annotation, fromDB);
        break;
    }

    // add to global list then save to disk
    if (!!result) {
      if (!fromDB) {
        if (!(annotation.pageNumber in this.annotations))
          this.annotations[annotation.pageNumber] = [];
        this.annotations[annotation.pageNumber].push(result.annotation);
        this.saveAnnotations();
      }

      if (!(annotation.pageNumber in this.doms))
        this.doms[annotation.pageNumber] = [];
      this.doms[annotation.pageNumber].push(result.dom);
      return result.dom;
    }
  }

  /**
   * Draw annotations on specific page
   * Because pdf.js only renders few pages to save resources
   * We can only draw on those pages when `pagerendered` event dispatched
   *
   * @param {number} pageNumber
   */
  drawAnnotations(pageNumber) {
    if (!(pageNumber in this.annotations)) return;
    for (let annot of this.annotations[pageNumber]) {
      this.createAnnotation(annot, true);
    }
  }

  /**
   * Bind function to the annotation doms on specific page number
   *
   * @param {number} pageNumber
   * @param {function} func
   * @returns
   */
  bindFunc2Doms(pageNumber, func) {
    if (!(pageNumber in this.doms)) return;

    for (let dom of this.doms[pageNumber]) {
      dom.onclick = () => func(dom);
    }
  }

  saveAnnotations() {
    let filePath = path.join(this.folderPath, "annotations.json");
    fs.writeFileSync(filePath, JSON.stringify(this.annotations));
  }

  getAnnotations() {
    let filePath = path.join(this.folderPath, "annotations.json");
    if (fs.existsSync(filePath)) {
      this.annotations = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  }

  modifyAnnotation(annotationId, newProperties) {
    let dom = document.getElementById(annotationId);
    let pageNumber = dom.parentNode.parentNode.getAttribute("data-page-number");
    for (let i in this.annotations[pageNumber]) {
      if (this.annotations[pageNumber][i].id == annotationId) {
        for (let key in newProperties) {
          // change annotation in global list
          this.annotations[pageNumber][i][key] = newProperties[key];

          // change annotation in ui
          if (this.annotations[pageNumber][i].type === AnnotationType.HIGHLIGHT)
            dom.firstChild.style.backgroundColor = newProperties.color;
        }
      }

      this.saveAnnotations();
    }
  }

  deleteAnnotation(annotationId) {
    // remove from ui
    let dom = document.getElementById(annotationId);
    let pageNumber = dom.parentNode.parentNode.getAttribute("data-page-number");
    dom.parentNode.removeChild(dom);

    // remove from global list and save to disk
    this.annotations[pageNumber] = this.annotations[pageNumber].filter(
      (annot) => annot.id != annotationId
    );
    this.saveAnnotations();
  }
}

export { AnnotationManager, AnnotationType };
