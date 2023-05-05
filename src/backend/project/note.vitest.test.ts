import { describe, it, expect } from "vitest";
import { db, Note } from "src/backend/database";
import {
  addNote,
  deleteNote,
  updateNote,
  getNote,
  getNotes,
} from "src/backend/project/note";
import { uid } from "quasar";

describe("note.ts", () => {
  it("addNote", async () => {
    let projectId = "projectId";
    let note = (await addNote(projectId)) as Note;
    expect(note.dataType).toBe("note");
    expect(note.projectId).toBe(projectId);
  });

  it("deleteNote", async () => {
    let note = (await addNote("projectId")) as Note;
    await deleteNote(note._id);

    let results = await db.find({
      selector: {
        _id: note._id,
      },
    });
    expect(results.docs.length).toBe(0);
  });

  it("updateNote", async () => {
    let n = (await addNote("projectId")) as Note;
    n.label = "test note";
    let note = (await updateNote(n)) as Note;
    expect(note.label).toBe(n.label);
  });

  it("getNotes", async () => {
    let projectId = uid();
    let n = 10;
    for (let i = 0; i < n; i++) await addNote(projectId);
    let notes = (await getNotes(projectId)) as Note[];
    expect(notes.length).toBe(n);
  });
});
