import { reactive, ref } from "vue";
import { AnnotationData, AnnotationType, db } from "../database";
import { Annotation, Ink } from "./annotations";

/**
 * Use this to communicate with database
 */
export default class AnnotationStore {
  projectId: string;
  annots = reactive<Annotation[]>([]);
  _selectedId = ref<string>("");

  get selectedId() {
    return this._selectedId.value;
  }
  set selectedId(id: string) {
    this._selectedId.value = id;
  }
  get selected() {
    return this.getById(this.selectedId);
  }

  constructor(projectId: string) {
    this.projectId = projectId;
  }

  /**
   * Save annotData to db and push it to annots list
   * @param annot
   * @param saveToDB
   */
  async add(annot: Annotation, saveToDB?: boolean) {
    if (saveToDB) {
      await annot.save();
    }
    if (!this.getById(annot.data._id)) this.annots.push(annot);
  }

  /**
   * Update annotData in db, the annot object in the list will be updated automatically
   * @param annotId
   * @param props
   */
  async update(annotId: string, props: AnnotationData) {
    let annot = this.getById(annotId);
    if (annot) await annot.update(props);
  }

  /**
   * Delete annotData in db and remove it from annots list
   * @param annotId
   */
  async delete(annotId: string) {
    let ind = this.annots.findIndex((annot) => annot.data._id === annotId);
    if (ind > -1) {
      let annot = this.annots[ind];
      await annot.delete();
      this.annots.splice(ind, 1);
    }
  }

  /**
   * Load and return annotDatas from db
   * @returns annotDatas
   */
  async loadFromDB() {
    try {
      // get all annotations of the currentry {
      let annotDatas = (
        await db.find({
          selector: { dataType: "pdfAnnotation", projectId: this.projectId },
        })
      ).docs as AnnotationData[];

      return annotDatas;
    } catch (err) {
      console.log(err);
      return [];
    }
  }

  getByPage(pageNumber: number) {
    return this.annots.filter((annot) => annot.data.pageNumber === pageNumber);
  }

  getById(annotId: string) {
    return this.annots.find((annot) => annot.data._id === annotId);
  }

  getInk(pageNumber: number) {
    return this.annots.find(
      (annot) =>
        annot.data.pageNumber === pageNumber &&
        annot.data.type === AnnotationType.INK
    ) as Ink | undefined;
  }

  setActive(annotId: string) {
    this.selectedId = annotId;
    for (let annot of this.annots) {
      annot.setActive(false);
      if (annot.data._id === annotId) annot.setActive(true);
    }
  }
}
