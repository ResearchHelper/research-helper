import { uid } from "quasar";
import { db, Annotation } from "../database";
import { comment } from "./comment";
import { highlight, highlightRect } from "./highlight";

const AnnotationType = {
  NONE: "cursor",
  COMMENT: "comment",
  HIGHLIGHT: "highlight",
  RECTANGLE: "rectangle",
};

/**
 * Get annotations of a project
 * @param projectId
 * @returns list of annotations
 */
async function getAnnotations(
  projectId: string
): Promise<Annotation[] | undefined> {
  try {
    let result = await db.find({
      selector: { dataType: "pdfAnnotation", projectId: projectId },
    });

    return result.docs as Annotation[];
  } catch (err) {
    console.log(err);
  }
}

/**
 * Get annotation by id
 * @param annotId
 * @returns annotation
 */
async function getAnnotationById(annotId: string): Promise<Annotation> {
  return (await db.get(annotId)) as Annotation;
}

/**
 * Add annotation to database
 * @param annot
 * @returns
 */
async function addAnnotation(annot: Annotation) {
  await db.put(annot);
}

/**
 * Update annotation in database
 * @param annot
 * @returns
 */
async function updateAnnotation(annot: Annotation) {
  await db.put(annot);
}

/**
 * Delete annotation from database
 * @param annotId
 * @returns
 */
async function deleteAnnotation(annotId: string) {
  try {
    let annot = await db.get(annotId);
    return await db.remove(annot);
  } catch (err) {
    console.log(err);
  }
}

/**
 * Create annotation for db and its corresponding DOMs
 * @param container
 * @param annot
 * @param fromDB
 * @returns an object, {annot, doms}, annot for db and doms for UI display
 */
async function createAnnotation(
  container: HTMLElement,
  annot: Annotation,
  fromDB = false
): Promise<{ annot: Annotation; doms: HTMLElement[] } | undefined> {
  if (!fromDB) {
    if (annot.type === AnnotationType.NONE) return;

    // some necessary attributes
    annot._id = uid();
    annot.dataType = "pdfAnnotation";
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
    case AnnotationType.RECTANGLE:
      result = highlightRect(container, annot, fromDB);
      break;
    default:
      result = { annot: {}, doms: [] };
      break;
  }

  // return the annots and corresponding doms
  if (result.doms.length > 0) {
    if (!fromDB) {
      await addAnnotation(result.annot);
    }
    return result;
  }
}

export {
  getAnnotations,
  getAnnotationById,
  addAnnotation,
  updateAnnotation,
  deleteAnnotation,
  createAnnotation,
  AnnotationType,
};
