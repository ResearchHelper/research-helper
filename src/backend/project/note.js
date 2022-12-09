import { db } from "../database";
import { useStateStore } from "src/stores/appState";
import { v4 as uuidv4 } from "uuid";

const fs = window.fs;
const path = window.path;

const stateStore = useStateStore();
const storagePath = stateStore.storagePath;

async function addNote(projectId) {
  let noteId = uuidv4();
  let filePath = path.join(storagePath, "projects", projectId, noteId + ".md");

  // create actual file
  fs.closeSync(fs.openSync(filePath, "w")); // create empty file

  // add to db
  let note = {
    _id: noteId,
    dataType: "note",
    projectId: projectId,
    links: { forward: [], backward: [] },
    label: "New Note",
    path: filePath,
  };
  await db.put(note);
  return await db.get(noteId);
}

async function deleteNote(noteId) {
  let note = await db.get(noteId);
  await db.remove(note);
}

async function updateNote(noteId, data) {
  let note = await db.get(noteId);
  for (let prop in data) {
    note[prop] = data[prop];
  }
  await db.put(note);
}

async function getNotes(projectId) {
  let result = await db.find({
    selector: {
      dataType: "note",
      projectId: projectId,
    },
  });

  return result.docs;
}

async function getAllNotes() {
  let result = await db.find({
    selector: {
      dataType: "note",
    },
  });

  return result.docs;
}

/**
 * Load note content as markdown string
 * @param {string} projectId
 * @param {string} noteId
 * @returns {string} content
 */
function loadNote(projectId, noteId) {
  let projectPath = path.join(storagePath, "projects", projectId);
  let notePath = path.join(projectPath, noteId + ".md");
  let content = "";
  if (fs.existsSync(notePath)) content = fs.readFileSync(notePath, "utf8");
  return content;
}

/**
 * Save markdown content to disk
 * @param {string} projectId
 * @param {string} noteId
 * @param {string} content
 */
function saveNote(projectId, noteId, content) {
  let projectPath = path.join(storagePath, "projects", projectId);
  let notePath = path.join(projectPath, noteId + ".md");
  fs.writeFileSync(notePath, content);
}

export {
  addNote,
  deleteNote,
  updateNote,
  getNotes,
  getAllNotes,
  loadNote,
  saveNote,
};
