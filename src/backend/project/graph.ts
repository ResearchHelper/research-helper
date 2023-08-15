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
 * Get nodes and edges that are conected to given item
 * Styles are set yet
 * @param noteId
 * @returns elements
 */
export async function getLinks(item: Project | Note) {
  try {
    let forwardIds = item.links ? item.links.map((link: Node) => link.id) : [];

    // query removes non-existing docs and duplicated docs
    let result = await db.query(function (doc: Project | Note, emit) {
      if (emit) {
        // forward links
        if (forwardIds.includes(doc._id)) emit("forward", doc);

        // backward links
        if (
          doc.links &&
          doc.links.map((link: Node) => link.id).includes(item._id)
        )
          emit("backward", doc);
      }
    });

    let pushedIds = [item._id];
    let nodes = [
      {
        data: {
          id: item._id,
          label: item.label,
          type: item.dataType,
          parent: item.projectId,
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
          source: row.key === "forward" ? item._id : row.id,
          target: row.key === "forward" ? row.id : item._id,
        },
      });
    }

    // add missing nodes as well
    if (item.links) {
      for (let link of item.links) {
        if (!pushedIds.includes(link.id)) {
          // link.type is default to undefined (missing) already
          nodes.push({ data: link });
          edges.push({
            data: {
              source: item._id,
              target: link.id,
            },
          });
        }
      }
    }
    return { nodes, edges };
  } catch (error) {
    console.log(error);
    return { nodes: [], edges: [] };
  }
}

/**
 * Given nodes, get each's parent project as node
 * @param nodes
 * @returns parentNodes
 */
export async function getParents(nodes: NodeUI[]) {
  let parentIds = nodes.map((node) => node.data.parent);
  // query removes non-existing docs and duplicated docs
  let result = await db.query(function (doc: Project, emit) {
    if (emit) {
      if (parentIds.includes(doc._id)) {
        let { _id: id, label, dataType: type } = doc;
        emit("parent", { data: { id, label, type } });
      }
    }
  });

  return result.rows.map((row) => row.value);
}
