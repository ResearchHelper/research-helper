import { v4 as uuidv4 } from "uuid";
import { useStateStore } from "src/stores/appState";
const stateStore = useStateStore();
const storagePath = stateStore.storagePath;
const path = window.path;
const fs = window.fs;

// project tree
/**
 * Create an empty markdown file and add the note info to info.json
 * @param {Dict} note
 * @returns {Dict} note
 */
function addNote(note) {
  note.noteId = uuidv4();

  let projectPath = path.join(storagePath, "projects", note.projectId);
  let filePath = path.join(projectPath, note.noteId + ".md");
  fs.closeSync(fs.openSync(filePath, "w")); // create empty file

  // record to info.json
  let infoPath = path.join(projectPath, "info.json");
  let info = JSON.parse(fs.readFileSync(infoPath, "utf8"));
  if (!("notes" in info)) info["notes"] = {};
  info["notes"][note.noteId] = note;
  fs.writeFileSync(infoPath, JSON.stringify(info));

  return note;
}

/**
 *
 * @param {string} projectId
 * @returns {Array} notes
 */
function getNotes(projectId) {
  let projectPath = path.join(storagePath, "projects", projectId);
  let infoPath = path.join(projectPath, "info.json");
  let info = JSON.parse(fs.readFileSync(infoPath, "utf8"));

  let notes = [];
  for (let noteId in info.notes) {
    notes.push(info.notes[noteId]);
  }
  return notes;
}

/**
 *
 * @param {Dict} note
 * @returns {boolean} success
 */
function deleteNote(note) {
  console.log(note);
  let projectId = note.projectId;
  let noteId = note.noteId;
  let projectPath = path.join(storagePath, "projects", projectId);
  let infoPath = path.join(projectPath, "info.json");
  let notePath = path.join(projectPath, noteId + ".md");

  // remove from disk
  fs.rmSync(notePath);

  // remove from info
  let info = JSON.parse(fs.readFileSync(infoPath, "utf8"));
  delete info.notes[noteId];
  fs.writeFileSync(infoPath, JSON.stringify(info));

  return true;
}

/**
 *
 * @param {Dict} newNote
 * @returns {boolean} success
 */
function modifyNote(newNote) {
  let projectId = newNote.projectId;
  let noteId = newNote.noteId;
  let projectPath = path.join(storagePath, "projects", projectId);
  let infoPath = path.join(projectPath, "info.json");

  // modify note info
  let info = JSON.parse(fs.readFileSync(infoPath, "utf8"));
  info.notes[noteId] = newNote;
  fs.writeFileSync(infoPath, JSON.stringify(info));

  return true;
}

// editing note
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

function saveNote(projectId, noteId, content) {
  let projectPath = path.join(storagePath, "projects", projectId);
  let notePath = path.join(projectPath, noteId + ".md");
  let infoPath = path.join(projectPath, "info.json");
  let info = JSON.parse(fs.readFileSync(infoPath, "utf8"));
  if (noteId in info.notes) fs.writeFileSync(notePath, content);
}

export { addNote, deleteNote, getNotes, modifyNote, loadNote, saveNote };
