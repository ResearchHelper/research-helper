import { uid } from "quasar";
import { db } from "../database";
import { comment } from "./comment";
import { highlight } from "./highlight";

const AnnotationType = {
  NONE: "cursor",
  COMMENT: "comment",
  HIGHLIGHT: "highlight",
  FREETEXT: "freetext",
  INK: "ink",
};

function createIndex() {
  return db.createIndex({
    index: {
      fields: ["dataType", "projectId", "pageNumber"],
    },
  });
}

async function getAnnotations(projectId) {
  try {
    let result = await db.find({
      selector: { dataType: "pdf_annotation", projectId: projectId },
    });

    return result.docs;
  } catch (err) {
    console.log(err);
  }
}

async function getAnnotationsByPage(pageNumber) {
  try {
    return db.find({
      selector: { pageNumber: pageNumber },
    });
  } catch (err) {
    console.log(err);
  }
}

function getAnnotationById(annotId) {
  return db.get(annotId);
}

function addAnnotation(annot) {
  return db.put(annot);
}

function updateAnnotation(annot) {
  return db.put(annot);
}

async function deleteAnnotation(annotId) {
  try {
    let annot = await getAnnotationById(annotId);
    return await db.remove(annot);
  } catch (err) {
    console.log(err);
  }
}

/**
 * Create annotation in db and return its corresponding DOMs
 * @param {HTMLElement} container
 * @param {Object} annot
 * @param {Boolean} fromDB
 * @returns {Array} array of doms
 */
async function createAnnotation(container, annot, fromDB = false) {
  if (!fromDB) {
    if (annot.type === AnnotationType.NONE) return;

    // some necessary attributes
    annot._id = uid();
    annot.dataType = "pdf_annotation";
    annot.content = "";
  }

  // don't draw existing annotation again
  if (!!document.querySelector(`section[annotation-id="${annot._id}"]`)) return;

  // create annotation and push to ui
  let result = null;
  let type = annot.type;
  switch (type) {
    case AnnotationType.HIGHLIGHT:
      result = highlight(container, annot, fromDB);
      break;
    case AnnotationType.COMMENT:
      result = comment(container, annot, fromDB);
      break;
    case AnnotationType.NONE:
      result = { annot: {}, doms: [] };
      break;
  }

  // return the annots and corresponding doms
  if (!!result.doms.length) {
    if (!fromDB) {
      await addAnnotation(result.annot);
    }
    return result;
  }
}

export {
  createIndex,
  getAnnotations,
  getAnnotationsByPage,
  getAnnotationById,
  addAnnotation,
  updateAnnotation,
  deleteAnnotation,
  createAnnotation,
  AnnotationType,
};
