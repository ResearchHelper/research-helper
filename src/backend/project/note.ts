import { db, Note, NoteType } from "../database";
import { uid } from "quasar";
import { Buffer } from "buffer";
import { createFile, deleteFile } from "./file";

const fs = window.fs;
const path = window.path;

/**
 * Add a note to database
 * and creates the actual markdown file in project folder
 * @param {string} projectId
 * @returns {Note} note
 */
async function addNote(
  projectId: string,
  type: NoteType
): Promise<Note | undefined> {
  try {
    let noteId: string = uid();

    // create actual file
    let extension = type === NoteType.EXCALIDRAW ? ".excalidraw" : ".md";
    let filePath = (await createFile(projectId, noteId + extension)) as string;

    // add to db
    let note = {
      _id: noteId,
      dataType: "note",
      projectId: projectId,
      label: "New Note",
      path: filePath,
      type: type,
    };
    await db.put(note);

    return await db.get(noteId);
  } catch (error) {
    console.log(error);
  }
}

/**
 * Delete a note from database and from disk
 * @param {string} noteId
 */
async function deleteNote(noteId: string) {
  try {
    // delete note entry from db
    let note: Note = await db.get(noteId);
    await db.remove(note as PouchDB.Core.RemoveDocument);

    // delete actual file
    await deleteFile(note.path);
  } catch (error) {
    console.log(error);
  }
}

/**
 * Update information of a note in database
 * @param {Note} note
 */
async function updateNote(newNote: Note): Promise<Note | undefined> {
  try {
    let note: Note = await db.get(newNote._id);
    newNote._rev = note._rev;
    let result = await db.put(newNote);
    newNote._rev = result.rev;
    return newNote;
  } catch (error) {
    console.log(error);
  }
}

/**
 * Get a note by its ID
 * @param {string} noteId
 * @returns {Note} note
 */
async function getNote(noteId: string): Promise<Note | undefined> {
  try {
    return await db.get(noteId);
  } catch (error) {
    console.log(error);
  }
}

/**
 * Get all notes belong to specific project
 * @param {string} projectId
 * @returns {Note[]} array of notes
 */
async function getNotes(projectId: string): Promise<Note[]> {
  try {
    let result = await db.find({
      selector: {
        dataType: "note",
        projectId: projectId,
      },
    });

    return result.docs as Note[];
  } catch (error) {
    console.log(error);
    return [];
  }
}

/**
 * Get all notes in database
 * @returns {Note[]} array of notes
 */
async function getAllNotes(): Promise<Note[]> {
  let result = await db.find({
    selector: {
      dataType: "note",
    },
  });

  return result.docs as Note[];
}

/**
 * Load note content from disk as markdown string
 * @param {string} noteId
 * @returns {string} content
 */
async function loadNote(noteId: string, notePath?: string): Promise<string> {
  try {
    let note: Note = await db.get(noteId);
    if (fs.existsSync(note.path)) return fs.readFileSync(note.path, "utf8");
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
 * @param {string} noteId
 * @param {string} content
 */
async function saveNote(noteId: string, content: string, notePath?: string) {
  try {
    let note: Note = await db.get(noteId);
    fs.writeFileSync(note.path, content);
  } catch (error) {
    if ((error as Error).name == "not_found") {
      // might be a note opened by plugin
      if (notePath) fs.writeFileSync(notePath, content);
      else console.log("Error: Must pass in a valid noteId or valid notePath");
    }
  }
}

/**
 * Upload image and save it under the project folder
 * If /img doesn't exist, it will create this folder
 * @param {string} noteId
 * @param {File} file
 */
async function uploadImage(
  noteId: string,
  file: File
): Promise<{ imgName: string; imgPath: string } | undefined> {
  if (!file.type.includes("image")) return;

  try {
    let note: Note = await db.get(noteId);
    let imgType: string = path.extname(file.name); // .png
    let imgName: string = uid() + imgType; // use uuid as img name
    let imgFolder: string = path.join(path.dirname(note.path), "img");
    let imgPath: string = path.join(imgFolder, imgName);
    if (!fs.existsSync(imgFolder)) fs.mkdirSync(imgFolder);

    let arrayBuffer: ArrayBuffer = await file.arrayBuffer();
    fs.writeFileSync(imgPath, Buffer.from(arrayBuffer));
    return { imgName: imgName, imgPath: imgPath };
  } catch (error) {
    console.log(error);
  }
}

export {
  addNote,
  deleteNote,
  updateNote,
  getNote,
  getNotes,
  getAllNotes,
  loadNote,
  saveNote,
  uploadImage,
};
