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
} from "src/api/annotation";

const stateStore = useStateStore();

export const useAnnotStore = defineStore("annotStore", {
  state: () => ({
    projectId: "",
    annots: [],
    selectedAnnotId: "",
  }),

  watch: {
    "stateStore.workingProject"(projectId) {
      console.log(projectId);
    },
  },

  actions: {
    async init(projectId) {
      this.projectId = projectId;
      try {
        await createIndex();
        await this.getAnnots();
      } catch (err) {
        console.log(err);
      }
    },

    async getAnnots() {
      try {
        this.annots = await getAnnotations(this.projectId);
        console.log("getAnnots:", this.annots);
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

    /**
     *
     * @param {str|null} annotId
     *
     * select the corresponding annot if annotId is provided
     */
    select(annotId) {
      // update AnnotationList UI
      this.selectedAnnotId = annotId;
      this.getAnnotById(annotId).then((annot) => {
        console.log(annot);
      });

      // update PDFReader UI
      // remove active class
      let doms = document.querySelectorAll(".activeAnnotation");
      for (let dom of doms) {
        dom.classList.remove("activeAnnotation");
      }

      if (!!annotId) {
        doms = document.querySelectorAll(`section[annotation-id="${annotId}"]`);
        if (!!doms.length) {
          // set active class
          for (let dom of doms) {
            dom.classList.add("activeAnnotation");
          }

          // AnnotationList scrollIntoView
          let card = document.querySelector(`div[annot-card-id="${annotId}"]`);
          card.scrollIntoView({
            behavior: "auto",
            block: "nearest",
          });
        }
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
