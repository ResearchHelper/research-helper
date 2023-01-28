import { db } from "../database";
import { uid } from "quasar";
import { Buffer } from "buffer";
import { createFile, deleteFile } from "./file";
import { updateEdge } from "./graph";

const fs = window.fs;
const path = window.path;

/**
 * Note data
 * @typedef {Object} Note
 * @property {string} _id - unique id handled by database
 * @property {string} _rev - rev handled by database
 * @property {string} dataType - for database search
 * @property {string} projectId - the project it belongs to
 * @property {string} path - path to actual markdown file
 * @property {string} label - markdown file name
 * @property {Array} forwardLinks - array of Links (link) to other notes/projects
 * @property {Array} backwardLinks - array of backward Links (links) from other notes/projects
 */

/**
 * Link object, equivalent to node object in graph (cytoscape)
 * @typedef {Object} Link
 * @property {string} id - id of the node
 * @property {string} label - label of the node
 * @property {string} type - "project" | "note"
 */

/**
 * Add a note to database
 * and creates the actual markdown file in project folder
 * @param {string} projectId
 * @returns {Note} note
 */
async function addNote(projectId) {
  try {
    let noteId = uid();

    // create actual file
    let filePath = await createFile(projectId, noteId + ".md");

    // add to db
    let note = {
      _id: noteId,
      dataType: "note",
      projectId: projectId,
      links: [],
      label: "New Note",
      path: filePath,
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
async function deleteNote(noteId) {
  try {
    // delete note entry from db
    let note = await db.get(noteId);
    await db.remove(note);

    // delete actual file
    await deleteFile(note.path);
  } catch (error) {
    console.log(error);
  }
}

/**
 * Update information of a note in database
 * @param {string} noteId
 * @param {Object} data
 */
async function updateNote(noteId, data) {
  try {
    let note = await db.get(noteId);
    for (let prop in data) {
      note[prop] = data[prop];
    }
    await db.put(note);
  } catch (error) {
    console.log(error);
  }
}

/**
 * Get a note by its ID
 * @param {string} noteId
 * @returns {Note} note
 */
async function getNote(noteId) {
  try {
    return await db.get(noteId);
  } catch (error) {
    console.log(error);
  }
}

/**
 * Get all notes belong to specific project
 * @param {string} projectId
 * @returns {Array} array of notes
 */
async function getNotes(projectId) {
  try {
    let result = await db.find({
      selector: {
        dataType: "note",
        projectId: projectId,
      },
    });

    return result.docs;
  } catch (error) {
    console.log(error);
    return [];
  }
}

/**
 * Get all notes in database
 * @returns {Array} array of notes
 */
async function getAllNotes() {
  let result = await db.find({
    selector: {
      dataType: "note",
    },
  });

  return result.docs;
}

/**
 * Load note content from disk as markdown string
 * @param {string} noteId
 * @returns {string} content
 */
async function loadNote(noteId) {
  try {
    let content = "";
    let note = await db.get(noteId);
    if (fs.existsSync(note.path)) content = fs.readFileSync(note.path, "utf8");
    return content;
  } catch (error) {
    console.log(error);
    return "";
  }
}

/**
 * Save markdown content to disk
 * @param {string} noteId
 * @param {string} content
 */
async function saveNote(noteId, content) {
  try {
    let note = await db.get(noteId);
    fs.writeFileSync(note.path, content);
  } catch (error) {
    console.log(error);
  }
}

/**
 * Upload image and save it under the project folder
 * If /img doesn't exist, it will create this folder
 * @param {String} noteId
 * @param {File} file
 */
async function uploadImage(noteId, file) {
  if (!file.type.includes("image")) return;

  try {
    let note = await getNote(noteId);
    let imgType = path.extname(file.name); // .png
    let imgName = uid() + imgType; // use uuid as img name
    let imgFolder = path.join(path.dirname(note.path), "img");
    let imgPath = path.join(imgFolder, imgName);
    if (!fs.existsSync(imgFolder)) fs.mkdirSync(imgFolder);

    let arrayBuffer = await file.arrayBuffer();
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
