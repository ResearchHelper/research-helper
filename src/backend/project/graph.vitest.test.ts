import { describe, it, expect, beforeAll } from "vitest";
import {
  getInEdges,
  getOutEdge,
  createEdge,
  deleteEdge,
  updateEdge,
  appendEdgeTarget,
  updateEdgeTarget,
  deleteEdgeTarget,
} from "src/backend/project/graph";
import { addProject } from "src/backend/project/project";
import { addNote, getNote } from "src/backend/project/note";
import { uid } from "quasar";
import { Edge, Node, Note, Project } from "../database";

let projectId = "";
let noteId = "";

describe("graph.ts", () => {
  beforeAll(async () => {
    let folderId = uid();
    let project = (await addProject(folderId)) as Project;
    await createEdge(project);

    let note = (await addNote(project._id)) as Note;
    await createEdge(note);
    await appendEdgeTarget(project._id, note);

    projectId = project._id;
    noteId = note._id;
  });

  it("getEdges", async () => {
    let edges = (await getInEdges(noteId)) as Edge[];
    expect(edges.length).toBe(1);
    expect(edges[0].targets).toContain(noteId);

    let edge = (await getOutEdge(projectId)) as Edge;
    expect(edge.targets).toContain(noteId);
  });

  it("updateEdge", async () => {
    let note = (await getNote(noteId)) as Note;
    note.label = "test label";
    let sourceNode = {
      id: noteId,
      label: note.label,
      type: "note",
    } as Node;
    await updateEdge(noteId, { sourceNode } as Edge);
    await updateEdgeTarget(projectId, note);

    let edge = (await getOutEdge(projectId)) as Edge;
    expect(edge.targetNodes.length).toBe(1);
    expect(edge.targetNodes[0].label).toBe(note.label);
  });

  it("deleteEdge", async () => {
    await deleteEdge(noteId);
    await deleteEdgeTarget(projectId, noteId);

    let edge = (await getOutEdge(projectId)) as Edge;
    expect(edge.targets).not.toContain(noteId);
  });
});
