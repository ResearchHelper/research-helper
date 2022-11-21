import { v4 as uuidv4 } from "uuid";
import { db } from "./database";
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
      fields: ["datatype", "projectId", "pageNumber"],
    },
  });
}

async function getAnnotations(projectId) {
  try {
    let result = await db.find({
      selector: { datatype: "pdf_annotation", projectId: projectId },
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

async function createAnnotation(annot, fromDB = false) {
  if (annot.type === AnnotationType.NONE) return;

  // give annotation an id if it has none
  if (!!!annot._id) annot._id = uuidv4();

  // some necessary attributes
  annot.datatype = "pdf_annotation";
  annot.comment = "";

  // create annotation and push to ui
  let result = null;
  let type = annot.type;
  switch (type) {
    case AnnotationType.HIGHLIGHT:
      result = highlight(annot, fromDB);
      break;
    case AnnotationType.COMMENT:
      result = comment(annot, fromDB);
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