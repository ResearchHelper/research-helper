/**
 * For drawing the graphs in cytoscape.
 *
 * An Edge object has one source and multiple targets
 */

import { db, Project, Note, Node, Edge } from "../database";

/**
 * Create outward edges
 * @param item - project / note
 */
async function createEdge(item: Project | Note) {
  try {
    let sourceNode: Node = {
      id: item._id,
      type: item.dataType,
      label: item.dataType === "project" ? item.title : item.label,
    };
    let edge = {
      dataType: "edge",
      source: sourceNode.id,
      targets: [],
      sourceNode: sourceNode,
      targetNodes: [],
    };
    await db.post(edge);
  } catch (error) {
    console.log(error);
  }
}

/**
 * Delete outward edges
 * @param nodeId - id of current node
 */
async function deleteEdge(nodeId: string) {
  try {
    let outEdge = (await getOutEdge(nodeId)) as Edge;
    await db.remove(outEdge as PouchDB.Core.RemoveDocument);
  } catch (error) {
    console.log(error);
  }
}

/**
 * Update properties of edge
 * @param nodeId - id of current node
 * @param props - properties to be changed
 */
async function updateEdge(nodeId: string, props: Edge) {
  try {
    let outEdge = (await getOutEdge(nodeId)) as Edge;
    props._rev = outEdge._rev;
    Object.assign(outEdge, props);
    await db.put(outEdge);
  } catch (error) {
    console.log(error);
  }
}

/**
 * Append a new target to the existing edge
 * @param nodeId
 * @param item
 */
async function appendEdgeTarget(nodeId: string, item: Project | Note) {
  try {
    let edge = (await getOutEdge(nodeId)) as Edge;
    edge.targets.push(item._id);
    edge.targetNodes.push({
      id: item._id,
      type: item.dataType,
      label: item.dataType === "project" ? item.title : item.label,
    });
    return await db.put(edge);
  } catch (error) {
    console.log(error);
  }
}

/**
 * Update an existing targetNode in edge
 * @param nodeId
 * @param item
 */
async function updateEdgeTarget(nodeId: string, item: Project | Note) {
  try {
    let edge = (await getOutEdge(nodeId)) as Edge;
    for (let i in edge.targets) {
      if (edge.targets[i] === item._id) {
        edge.targetNodes[i] = {
          id: item._id,
          type: item.dataType,
          label: item.dataType === "project" ? item.title : item.label,
        };
        return await db.put(edge);
      }
    }
  } catch (error) {
    console.log(error);
  }
}

/**
 * Delete specific target from an edge
 * @param nodeId
 * @param itemId
 * @returns
 */
async function deleteEdgeTarget(nodeId: string, itemId: string) {
  try {
    let edge = (await getOutEdge(nodeId)) as Edge;
    edge.targets = edge.targets.filter((targetId) => targetId != itemId);
    edge.targetNodes = edge.targetNodes.filter(
      (targetNode) => targetNode.id != itemId
    );
    return await db.put(edge);
  } catch (error) {
    console.log(error);
  }
}

/**
 * Get both outward edges (forward links)
 * @param nodeId
 * @returns edge with source=nodeId
 */
async function getOutEdge(nodeId: string): Promise<Edge | undefined> {
  try {
    let result = await db.find({
      selector: {
        dataType: "edge",
        source: nodeId,
      },
    });
    // each source corresponds to exactly 1 edge data
    return result.docs[0] as Edge;
  } catch (error) {
    console.log(error);
  }
}

/**
 * Get both inward edges (backward links)
 * @param nodeId
 * @returns edges with targets containing nodeId
 */
async function getInEdges(nodeId: string): Promise<Edge[] | undefined> {
  try {
    let result = await db.find({
      selector: {
        dataType: "edge",
        targets: { $in: [nodeId] },
      },
    });
    // there maybe many nodes connecting to this node
    return result.docs as Edge[];
  } catch (error) {
    console.log(error);
  }
}

export {
  getInEdges,
  getOutEdge,
  createEdge,
  deleteEdge,
  updateEdge,
  appendEdgeTarget,
  updateEdgeTarget,
  deleteEdgeTarget,
};
