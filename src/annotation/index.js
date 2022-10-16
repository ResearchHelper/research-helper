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
  FREETEXT: "freetext",
  INK: "ink",
  HIGHLIGHT: "highlight",
};

class Annotation {
  constructor(pdfViewer) {
    this.pdfViewer = pdfViewer;
    this.folderPath = path.join(
      storagePath,
      "projects",
      stateStore.workingProject.projectId
    );
    this.annotations = [];
    this.doms = [];

    this.getAnnotations();
  }

  createAnnotation(annotation, fromDB = false) {
    if (annotation.type === AnnotationType.NONE) return;

    // give it an id
    if (!annotation.id) annotation.id = uuidv4();

    // push to ui
    let result = null;
    let type = annotation.type;
    switch (type) {
      case AnnotationType.HIGHLIGHT:
        result = highlight(annotation, this, fromDB);
        break;
      case AnnotationType.COMMENT:
        result = comment(annotation, this, fromDB);
        break;
    }

    // save to DB
    // this.annotations.push(result.annotation);
    if (!!result) {
      this.annotations.push(result.annotation);
      if (!fromDB) this.saveAnnotations();
      return result.dom;
    }
  }

  saveAnnotations() {
    let filePath = path.join(this.folderPath, "annotations.json");
    fs.writeFileSync(filePath, JSON.stringify(this.annotations));
  }

  getAnnotations() {
    let filePath = path.join(this.folderPath, "annotations.json");
    let annotations;
    try {
      annotations = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (err) {
      console.log(err);
      annotations = [];
    }

    for (let annotation of annotations) {
      let dom = this.createAnnotation(annotation, true);
      this.doms.push(dom);
    }
  }

  modifyAnnotation(annotationId, newProperties) {
    let dom = document.getElementById(annotationId);
    for (let i in this.annotations) {
      if (this.annotations[i].id == annotationId) {
        for (let key in newProperties) {
          this.annotations[i][key] = newProperties[key];

          if (this.annotations[i].type === AnnotationType.HIGHLIGHT)
            dom.firstChild.style.backgroundColor = newProperties.color;
        }
      }

      this.saveAnnotations();
    }
  }

  deleteAnnotation(annotationId) {
    this.annotations = this.annotations.filter(
      (annot) => annot.id != annotationId
    );
    // this.doms = this.doms.filter((dom) => dom.id != annotationId);
    let dom = document.getElementById(annotationId);
    dom.parentNode.removeChild(dom);

    this.saveAnnotations();
  }
}

export { Annotation, AnnotationType };
