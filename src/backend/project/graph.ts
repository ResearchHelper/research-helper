/**
 * For drawing the graphs in cytoscape.
 */
import { EdgeUI, NodeUI, Node, Note, Project, db } from "../database";

export async function getItem(
  itemId: string
): Promise<Project | Note | undefined> {
  try {
    return await db.get(itemId);
  } catch (error) {
    console.log(error);
  }
}

/**
 * Get nodes and edges that are conected to given noteId
 * Styles are set yet
 * @param noteId
 * @returns elements
 */
export async function getLinks(noteId: string) {
  try {
    // get the note first
    let note = (await getItem(noteId)) as Note;
    let forwardIds = note.links.map((link) => link.id);

    let result = await db.query(function (doc: Project | Note, emit) {
      if (emit) {
        // forward links
        if (forwardIds.includes(doc._id)) emit("forward", doc);

        // backward links
        if (
          doc.links &&
          doc.links.map((link: Node) => link.id).includes(noteId)
        )
          emit("backward", doc);
      }
    });

    let pushedIds = [note._id];
    let nodes = [
      {
        data: {
          id: note._id,
          label: note.label,
          type: "note",
          parent: note.projectId,
        },
      },
    ] as NodeUI[];
    let edges = [] as EdgeUI[];
    for (let row of result.rows) {
      // add to nodes
      if (!pushedIds.includes(row.id)) {
        let { _id: id, label, dataType: type, projectId: parent } = row.value;
        nodes.push({ data: { id, label, type, parent } });
        pushedIds.push(row.id);
      }

      // add to edges
      edges.push({
        data: {
          source: row.key === "forward" ? note._id : row.id,
          target: row.key === "forward" ? row.id : note._id,
        },
      });
    }

    // add missing nodes as well
    for (let link of note.links) {
      if (!pushedIds.includes(link.id)) {
        // link.type is default to undefined (missing) already
        nodes.push({ data: link });
        edges.push({
          data: {
            source: note._id,
            target: link.id,
          },
        });
      }
    }
    return { nodes, edges };
  } catch (error) {
    console.log(error);
    return { nodes: [], edges: [] };
  }
}

export async function getParents(nodes: NodeUI[]) {
  let parentIds = nodes.map((node) => node.data.parent);
  console.log("parentIds", parentIds);
  let result = await db.query(function (doc: Project, emit) {
    if (emit) {
      if (parentIds.includes(doc._id)) {
        let { _id: id, label, dataType: type } = doc;
        emit("parent", { data: { id, label, type } });
      }
    }
  });

  console.log(
    "parentNodes",
    result.rows.map((row) => row.value)
  );
  return result.rows.map((row) => row.value);
}
window.getLinks = getLinks;
window.getParents = getParents;
