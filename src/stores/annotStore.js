import { useStateStore } from "./appState";
import { defineStore } from "pinia";
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

const stateStore = useStateStore();

export const useAnnotStore = defineStore("annotStore", {
  state: () => ({
    projectId: "",
    annots: [],
    selectedAnnotId: "",
  }),

  actions: {
    async init(projectId) {
      this.projectId = projectId;
      try {
        // await createIndex();
        await this.getAnnots();
      } catch (err) {
        console.log(err);
      }
    },

    async getAnnots() {
      try {
        this.annots = await getAnnotations(this.projectId);
      } catch (err) {
        console.log(err);
      }
    },

    getAnnotsByPage(pageNumber) {
      let annots = [];
      for (let annot of this.annots) {
        if (annot.pageNumber == parseInt(pageNumber)) {
          annots.push(annot);
        }
      }
      return annots;
    },

    async getAnnotById(annotId) {
      try {
        return await getAnnotationById(annotId);
      } catch (err) {
        console.log(err);
      }
    },

    async create(rawAnnot, fromDB = false) {
      // add to DB and
      // return the corresponding doms (for PDFReader UI)
      rawAnnot.projectId = this.projectId;
      let result = await createAnnotation(rawAnnot, fromDB);
      if (!!!result) return []; // return empty doms if just clicking

      // update AnnotationList UI
      if (!fromDB && !!result.doms.length) {
        this.annots.push(result.annot);
      }

      return result.doms;
    },

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
    },

    delete(annotId) {
      deleteAnnotation(annotId);

      // update PDFReader UI
      for (let dom of document.querySelectorAll(
        `section[annotation-id="${annotId}"]`
      )) {
        dom.remove();
      }

      // update AnnotationList UI
      this.annots = this.annots.filter((annot) => annot._id != annotId);
    },
  },
});
