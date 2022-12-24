import { db } from "../database";
import { updateProject } from "./project";
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
    links: [],
    label: "New Note",
    path: filePath,
  };
  await db.put(note);

  // update note list in project
  let project = await db.get(projectId);
  project.notes.push(noteId);
  await updateProject(project);

  // return note
  return await db.get(noteId);
}

async function getParentProject(noteId) {
  try {
    let result = await db.find({
      selector: {
        dataType: "project",
        notes: { $in: [noteId] },
      },
    });

    // there is a unique project containing the note
    return result.docs[0];
  } catch (error) {
    console.log(error);
  }
}

async function deleteNote(noteId) {
  // delete note entry from db
  let note = await db.get(noteId);
  await db.remove(note);

  // update project's note list
  let project = getParentProject(noteId);
  project.children = project.children.filter((id) => id != noteId);
  await updateProject(project);
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
  let content = "";
  let note = await db.get(noteId);
  if (fs.existsSync(note.path)) content = fs.readFileSync(note.path, "utf8");
  return content;
}

/**
 * Save markdown content to disk
 * @param {string} noteId
 * @param {string} content
 */
async function saveNote(noteId, content) {
  let note = await db.get(noteId);
  fs.writeFileSync(note.path, content);
}

/**
 * Upload image and save it under the same folder
 * @param {String} noteId
 * @param {File} file
 */
async function uploadImage(noteId, file) {
  if (!file.type.includes("image")) return;

  try {
    let note = await getNote(noteId);
    let imgType = path.extname(file.name); // .png
    let imgName = uuidv4() + imgType; // use uuid as img name
    // let imgFolder = path.join(storagePath, "projects", projectId, "img");
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

/**
 * Drop note into another project, and put it as the last note
 * @param {String} dragNoteId
 * @param {String} dropProjectId
 */
async function moveNoteInto(dragNoteId, dropProjectId) {
  try {
    // remove from the parent project
    let dragParentProject = await getParentProject(dragNoteId);
    console.log(dragParentProject);
    dragParentProject.notes = dragParentProject.notes.filter(
      (id) => id != dragNoteId
    );
    await updateProject(dragParentProject);

    // add to the target project
    let dropProject = await db.get(dropProjectId);
    dropProject.notes.push(dragNoteId);
    await updateProject(dropProject);
  } catch (error) {
    console.log(error);
  }
}

/**
 * Drop note below another note, reorder within the same project
 * @param {String} dragNoteId
 * @param {String} dropNoteId
 */
async function moveNoteBelow(dragNoteId, dropNoteId) {
  try {
    let dragParentProject = await getParentProject(dragNoteId);
    let dropParentProject = await getParentProject(dropNoteId);

    if (dragParentProject._id != dropParentProject._id) return;

    let notes = dragParentProject.notes;
    let from = notes.findIndex((id) => id == dragNoteId);
    let to = notes.findIndex((id) => id == dropNoteId);
    notes.splice(parseInt(to) + 1, 0, notes.splice(from, 1)[0]);
    dragParentProject.notes = notes;
    await updateProject(dragParentProject);
  } catch (error) {
    console.log(error);
  }
}

export {
  addNote,
  deleteNote,
  updateNote,
  getNote,
  getAllNotes,
  loadNote,
  saveNote,
  uploadImage,
  moveNoteInto,
  moveNoteBelow,
};
