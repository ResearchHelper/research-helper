import { db } from "../database";
import { useStateStore } from "src/stores/appState";
import { v4 as uuidv4 } from "uuid";
import { Buffer } from "buffer";

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
    links: [],
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

async function getNote(noteId) {
  return await db.get(noteId);
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
 * @param {string} noteId
 * @returns {string} content
 */
async function loadNote(noteId) {
  let note = await db.get(noteId);
  let projectPath = path.join(storagePath, "projects", note.projectId);
  let notePath = path.join(projectPath, noteId + ".md");
  let content = "";
  if (fs.existsSync(notePath)) content = fs.readFileSync(notePath, "utf8");
  return content;
}

/**
 * Save markdown content to disk
 * @param {string} noteId
 * @param {string} content
 */
async function saveNote(noteId, content) {
  let note = await db.get(noteId);
  let projectPath = path.join(storagePath, "projects", note.projectId);
  let notePath = path.join(projectPath, noteId + ".md");
  fs.writeFileSync(notePath, content);
}

/**
 * Upload image and save it under the same project folder
 * @param {String} projectId
 * @param {File} file
 */
async function uploadImage(projectId, file) {
  if (!file.type.includes("image")) return;

  try {
    let imgType = path.extname(file.name); // .png
    let imgName = uuidv4() + imgType;
    let imgFolder = path.join(storagePath, "projects", projectId, "img");
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
