import { uid } from "quasar";
import {
  Project as ProjectData,
  Note as NoteData,
  NoteType,
  db,
  SpecialFolder,
} from "../database";
import {
  createFile,
  createProjectFolder,
  deleteFile,
  deleteProjectFolder,
} from "./file";
import { reactive } from "vue";

const fs = window.fs;
const path = window.path;

/**
 * Note class
 * All note related operations are here
 */
export class Note {
  private _data = reactive<NoteData>({} as NoteData);

  get data() {
    return this._data;
  }

  set data(noteData: NoteData) {
    Object.assign(this._data, noteData);
  }

  /**
   * Create a noteData
   * @param projectId
   * @param type
   */
  async create(projectId: string, type: NoteType) {
    this.data = {
      _id: uid(),
      _rev: "",
      timestampAdded: Date.now(),
      timestampModified: Date.now(),
      dataType: "note",
      projectId: projectId,
      label: "New Note",
      path: "",
      type: type,
    } as NoteData;
  }

  /**
   * Load noteData from database
   * @param id
   */
  async load(id: string) {
    try {
      this.data = await db.get(id);
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Add a note to database
   * and creates the actual markdown file in project folder
   */
  async save() {
    try {
      // create actual file
      let extension =
        this.data.type === NoteType.EXCALIDRAW ? ".excalidraw" : ".md";
      let filePath = (await createFile(
        this.data.projectId,
        this.data._id + extension
      )) as string;

      // add to db
      this.data.path = filePath;
      let response = await db.put(this.data);
      this.data._rev = response.rev;
    } catch (error) {
      console.log(error);
    }
  }

  async update(newNote: NoteData) {
    try {
      let note: NoteData = await db.get(newNote._id);
      newNote._rev = note._rev;
      newNote.timestampModified = Date.now();
      let result = await db.put(newNote);
      newNote._rev = result.rev;
      return newNote;
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Delete a note from database and from disk
   */
  async delete() {
    try {
      // delete note entry from db
      let note: NoteData = await db.get(this.data._id);
      await db.remove(note);

      // delete actual file
      await deleteFile(note.path);
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Load note content from disk as markdown string
   * @param notePath
   * @returns content
   */
  async loadContent(notePath?: string): Promise<string> {
    try {
      if (!!this.data.path && fs.existsSync(this.data.path))
        return fs.readFileSync(this.data.path, "utf8");
      else return "";
    } catch (error) {
      if ((error as Error).name == "not_found") {
        if (notePath) return fs.readFileSync(notePath, "utf8");
        else {
          console.log("Error: Must have a valid noteId or notePath");
          return "";
        }
      }
      return "";
    }
  }

  /**
   * Save markdown content to disk
   * @param content
   * @param notePath
   */
  async saveContent(content: string, notePath?: string) {
    try {
      fs.writeFileSync(this.data.path, content);
    } catch (error) {
      if ((error as Error).name == "not_found") {
        // might be a note opened by plugin
        if (notePath) fs.writeFileSync(notePath, content);
        else
          console.log("Error: Must pass in a valid noteId or valid notePath");
      }
    }
  }

  /**
   * Upload image and save it under the project folder
   * If /img doesn't exist, it will create this folder
   * @param file
   */
  async uploadImage(
    file: File
  ): Promise<{ imgName: string; imgPath: string } | undefined> {
    if (!file.type.includes("image")) return;

    try {
      let imgType: string = path.extname(file.name); // .png
      let imgName: string = uid() + imgType; // use uuid as img name
      let imgFolder: string = path.join(path.dirname(this.data.path), "img");
      let imgPath: string = path.join(imgFolder, imgName);
      if (!fs.existsSync(imgFolder)) fs.mkdirSync(imgFolder);

      let arrayBuffer: ArrayBuffer = await file.arrayBuffer();
      fs.writeFileSync(imgPath, Buffer.from(arrayBuffer));
      return { imgName: imgName, imgPath: imgPath };
    } catch (error) {
      console.log(error);
    }
  }
}

/**
 * Project class
 * All project related operations are here
 * Also serve as a NoteStore, it maintains a notes array
 */
export class Project {
  private _data = reactive<ProjectData>({} as ProjectData);
  notes = reactive<Note[]>([]);

  get data() {
    return this._data;
  }

  set data(projectData: ProjectData) {
    Object.assign(this._data, projectData);
  }

  /**
   * Create a project data
   * @param folderId
   */
  async create(folderId: string) {
    // create empty project entry
    let project = {
      _id: uid(),
      _rev: "",
      timestampAdded: Date.now(),
      timestampModified: Date.now(),
      dataType: "project",
      label: "New Project",
      title: "New Project",
      path: "",
      tags: [] as string[],
      folderIds: ["library"],
    } as ProjectData;
    if (folderId != "library") project.folderIds.push(folderId);
    this.data = project;
  }

  /**
   * Load projectData from database
   * @param id
   */
  async load(id: string) {
    try {
      this.data = await db.get(id);
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Add empty projet to database, creates project folder and returns the project
   * The project is added to folder with folderId
   */
  async save() {
    try {
      // create actual folder for containing its files
      await createProjectFolder(this.data._id);

      // put entry to database
      let result = await db.put(this.data);
      this.data._rev = result.rev;

      this.data = this.data;
    } catch (err) {
      console.log(err);
    }
  }

  /**
   * Update project in database and returns the updated project
   * @param project
   */
  async update(project: ProjectData) {
    try {
      let oldProject = await db.get(project._id);
      project._rev = oldProject._rev;
      project.timestampModified = Date.now();
      project.label = project.title; // also update label
      let result = await db.put(project);
      project._rev = result.rev;
      return project;
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Delete project from a folder.
   * If deleteFromDB is true, delete the project from all folders
   * and remove the actual folder containing the project files in storage path
   * @param deleteFromDB
   * @param folderId
   */
  async delete(deleteFromDB: boolean, folderId?: string) {
    try {
      let project: ProjectData = await db.get(this.data._id);
      if (deleteFromDB) {
        // remove from db
        await db.remove(project);

        // remove related pdfState, pdfAnnotation and notes on db
        let result = await db.find({
          selector: {
            projectId: project._id,
          },
        });
        for (let doc of result.docs) {
          await db.remove(doc);
        }

        // remove the acutual files
        // (do not rely on project.path because it might be empty)
        await deleteProjectFolder(this.data._id);
      } else {
        if (folderId === undefined) throw new Error("folderId is needed");
        project.folderIds = project.folderIds.filter((id) => id != folderId);
        await db.put(project);
      }
    } catch (err) {
      console.log(err);
    }
  }

  async addNote(note: Note, saveToDB?: boolean) {
    if (saveToDB) note.save();
    if (!this.getNote(note.data._id)) this.notes.push(note);
  }

  async updateNote(noteId: string, noteData: NoteData) {
    let note = this.getNote(noteId);
    if (note) note.update(noteData);
  }

  async deleteNote(noteId: string) {
    let ind = this.notes.findIndex((note) => note.data._id === noteId);
    if (ind > -1) {
      let note = this.notes[ind];
      await note.delete();
      this.notes.splice(ind, 1);
    }
  }

  /**
   * Get all notes belong to specific project
   */
  async loadNotes() {
    try {
      let noteDatas = (
        await db.find({
          selector: {
            dataType: "note",
            projectId: this.data._id,
          },
        })
      ).docs as NoteData[];

      // TODO: remove this few more versions later
      let flag = false;
      for (let noteData of noteDatas)
        if (!noteData.timestampAdded) {
          noteData.timestampAdded = Date.now();
          noteData.timestampModified = Date.now();
          flag = true;
        }
      if (flag) {
        let responses = await db.bulkDocs(noteDatas);
        for (let i in responses) {
          let rev = responses[i].rev;
          if (rev) noteDatas[i]._rev = rev;
        }
      }

      for (let noteData of noteDatas) {
        let note = new Note();
        note.data = noteData;
        this.notes.push(note);
      }
    } catch (error) {
      console.log(error);
    }
  }

  getNote(noteId: string) {
    return this.notes.find((note) => note.data._id === noteId);
  }
}

/**
 * ProjectStore
 * It maintains a projects array
 */
export class ProjectStore {
  projects = reactive<Project[]>([]);

  async add(project: Project, saveToDB?: boolean) {
    if (saveToDB) project.save();
    if (!this.get(project.data._id)) this.projects.push(project);
  }

  async update(projectData: ProjectData) {
    let project = this.get(projectData._id);
    if (project) project.update(projectData);
  }

  async delete(projectId: string, deleteFromDB: boolean, folderId?: string) {
    let ind = this.projects.findIndex(
      (project) => project.data._id === projectId
    );
    if (ind > -1) {
      let project = this.projects[ind];
      await project.delete(deleteFromDB, folderId);
      this.projects.splice(ind, 1);
    }
  }

  async loadFromDB(folderId: string) {
    let projectDatas = [] as ProjectData[];
    switch (folderId) {
      case SpecialFolder.LIBRARY:
        projectDatas = (
          await db.find({
            selector: { dataType: "project" },
          })
        ).docs as ProjectData[];
        break;
      case SpecialFolder.ADDED:
        let date = new Date();
        // get recently added project in the last 30 days
        let timestamp = date.setDate(date.getDate() - 30);
        projectDatas = (
          await db.find({
            selector: {
              dataType: "project",
              timestampAdded: {
                $gt: timestamp,
              },
            },
          })
        ).docs as ProjectData[];
        // sort projects in descending order
        projectDatas.sort((a, b) => b.timestampAdded - a.timestampAdded);
        break;
      case SpecialFolder.FAVORITES:
        projectDatas = (
          await db.find({
            selector: {
              dateType: "project",
              favorite: true,
            },
          })
        ).docs as ProjectData[];
        break;
      default:
        projectDatas = (
          await db.find({
            selector: {
              dataType: "project",
              folderIds: { $in: [folderId] },
            },
          })
        ).docs as ProjectData[];
        break;
    }

    // TODO: remove this few more versions later
    let flag = false;
    for (let projectData of projectDatas)
      if (!projectData.timestampAdded) {
        projectData.timestampAdded = Date.now();
        projectData.timestampModified = Date.now();
        flag = true;
      }
    if (flag) {
      let responses = await db.bulkDocs(projectDatas);
      for (let i in responses) {
        let rev = responses[i].rev;
        if (rev) projectDatas[i]._rev = rev;
      }
    }

    for (let projectData of projectDatas) {
      let project = new Project();
      project.data = projectData;
      this.projects.push(project);
    }
  }

  get(projectId: string) {
    return this.projects.find((project) => project.data._id === projectId);
  }
}

/********************
 * Utility funcitons
 ********************/

export async function getAllProjectDatas() {
  let result = await db.find({
    selector: {
      dataType: "project",
    },
  });
  return result.docs as ProjectData[];
}

export async function getAllNoteDatas() {
  let result = await db.find({
    selector: {
      dataType: "note",
    },
  });
  return result.docs as NoteData[];
}

export async function getItemData(
  itemId: string
): Promise<NoteData | ProjectData | undefined> {
  try {
    return await db.get(itemId);
  } catch (error) {
    console.log(error);
  }
}
