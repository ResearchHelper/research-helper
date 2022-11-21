import { defineStore } from "pinia";
import { v4 as uuidv4 } from "uuid";
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
import { db } from "src/api/database";

export const useAnnotStore = defineStore("annotStore", {
  state: () => ({
    annots: [],
    event: {},
    selectedAnnotId: "",

    _inited: false,
  }),

  actions: {
    async init(msg) {
      console.log(msg);
      try {
        await createIndex();
        // FIXME: don't know why, comment is empty for the first call
        await this.getAnnots();
        this._inited = true;
      } catch (err) {
        console.log(err);
      }
    },

    async getAnnots() {
      try {
        this.annots = await getAnnotations();
        // FIXME: comment is modified in database already
        // but after pulling it the comment is ""
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
