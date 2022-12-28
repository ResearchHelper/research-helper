import { db } from "../database";
import { updateProject } from "./project";
import { useStateStore } from "src/stores/appState";
import { uid } from "quasar";
import { Buffer } from "buffer";

const fs = window.fs;
const path = window.path;

const stateStore = useStateStore();
const storagePath = stateStore.storagePath;

async function addNote(projectId) {
  let noteId = uid();
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
  try {
    // delete note entry from db
    let note = await db.get(noteId);
    await db.remove(note);
  } catch (error) {
    console.log(error);
  }
}

async function updateNote(noteId, data) {
  let note = await db.get(noteId);
  for (let prop in data) {
    note[prop] = data[prop];
  }
  await db.put(note);
}

async function getNote(noteId) {
  try {
    return await db.get(noteId);
  } catch (error) {
    console.log(error);
  }
}

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
 * Upload image and save it under the same folder
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

/**
 * Drop note into another project, and put it as the last note
 * @param {String} dragNoteId
 * @param {String} dropProjectId
 */
async function moveNoteInto(dragNoteId, dropProjectId) {
  try {
    let note = await db.get(dragNoteId);
    note.projectId = dropProjectId;
    await db.put(note);
  } catch (error) {
    console.log(error);
  }
}
// async function moveNoteInto(dragNoteId, dropProjectId) {
//   try {
//     // remove from the parent project
//     let dragParentProject = await getParentProject(dragNoteId);
//     console.log(dragParentProject);
//     dragParentProject.notes = dragParentProject.notes.filter(
//       (id) => id != dragNoteId
//     );
//     await updateProject(dragParentProject);

//     // add to the target project
//     let dropProject = await db.get(dropProjectId);
//     dropProject.notes.push(dragNoteId);
//     await updateProject(dropProject);
//   } catch (error) {
//     console.log(error);
//   }
// }

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
  getNotes,
  getAllNotes,
  loadNote,
  saveNote,
  uploadImage,
};
