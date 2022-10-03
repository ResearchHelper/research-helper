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
  NONE: 0,
  COMMENT: 1,
  FREETEXT: 2,
  INK: 3,
  HIGHLIGHT: 4,
};

class Annotation {
  constructor(pdfViewer) {
    this.pdfViewer = pdfViewer;
    this.folderPath = path.join(
      storagePath,
      "projects",
      stateStore.selectedProject.projectId
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
    let type = annotation.type;
    switch (type) {
      case AnnotationType.HIGHLIGHT:
        annotation = highlight(annotation, this.pdfViewer, fromDB);
        break;
      case AnnotationType.COMMENT:
        annotation = comment(annotation, this.pdfViewer, fromDB);
    }

    // save to DB
    this.annotations.push(annotation);
    if (!fromDB) this.saveAnnotations();

    return annotation.dom;
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

  modify() {
    // TODO: modify an annotation
  }

  delete() {
    // TODO: delete an annotation
  }
}

export { Annotation, AnnotationType };
