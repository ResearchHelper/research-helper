import { describe, it, expect } from "vitest";
import { Note, NoteType } from "src/backend/database";
import {
  createNote,
  addNote,
  deleteNote,
  updateNote,
  getNote,
  getNotes,
} from "src/backend/project/note";

describe("note.ts", () => {
  it("createNote", async () => {
    let type = NoteType.MARKDOWN;
    let projectId = "test-id";
    let note = createNote(projectId, type);
    expect(note.type).toBe(type);
    expect(note.projectId).toBe(projectId);
  });

  it("deleteNote", async () => {
    let note = createNote("", NoteType.MARKDOWN);
    await addNote(note);
    await deleteNote(note._id);

    let result = await getNote(note._id);
    expect(result).toBe(undefined);
  });

  it("updateNote", async () => {
    let note = createNote("", NoteType.MARKDOWN);
    let n = (await addNote(note)) as Note;
    n.label = "test note";
    let nn = (await updateNote(n._id, n)) as Note;
    expect(nn.label).toBe(n.label);
  });

  it("getNotes", async () => {
    let n = 10;
    for (let i = 0; i < n; i++) {
      let note = createNote("projectId", NoteType.MARKDOWN);
      await addNote(note);
    }
    let notes = (await getNotes("projectId")) as Note[];
    expect(notes.length).toBe(n);
  });
});
