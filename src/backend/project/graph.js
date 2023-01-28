/**
 * For drawing the graphs in cytoscape.
 *
 * An Edge object has one source and multiple targets
 */

import { db } from "../database";

/**
 * @typedef {import("./project").Project} Project
 */

/**
 * @typedef {import("./note").Note} Note
 */

/**
 * Node data
 * @typedef {Object} Node
 * @property {string} id - id of the node
 * @property {string} label - label of the node
 * @property {string|undefined} type - "project" | "note" | undefined
 */

/**
 * Edge data (this is the data that goes into db)
 * @typedef {Object} OutEdge
 * @property {string} _id - handled by db
 * @property {string} _rev - handled by db
 * @property {string} _deleted - handled by db
 * @property {string} dataType - "edge"
 * @property {string} type - "link" | "reference"
 * @property {string} source - source id
 * @property {string[]} targets - array of target ids
 * @property {Node} sourceNode - source node
 * @property {Node[]} targetNodes - array of target Nodes
 */

/**
 * Create outward edges
 * @param {Project | Note} item - project / note item
 * @returns {Object} db operation result
 */
async function createEdge(item) {
  try {
    let sourceNode = {
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
    return await db.post(edge);
  } catch (error) {
    console.log(error);
  }
}

/**
 * Delete outward edges
 * @param {string} nodeId - id of current node
 * @returns {Object} db operations result
 */
async function deleteEdge(nodeId) {
  try {
    let outEdge = await getOutEdge(nodeId);
    await db.remove(outEdge);
  } catch (error) {
    console.log(error);
  }
}

/**
 * Update outward edges
 * @param {string} nodeId - id of current node
 * @param {Object} data - data to be changed
 * @returns {Object} db operation result
 */
async function updateEdge(nodeId, data) {
  try {
    let outEdge = await getOutEdge(nodeId);
    for (let prop in data) {
      outEdge[prop] = data[prop];
    }
    return await db.put(outEdge);
  } catch (error) {
    console.log(error);
  }
}

/**
 * Append a new target to the existing edge
 * @param {string} nodeId
 * @param {Project | Note} item
 * @returns {Object} db operation result
 */
async function appendEdgeTarget(nodeId, item) {
  try {
    let edge = await getOutEdge(nodeId);
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
 * @param {string} nodeId
 * @param {Project | Note} item
 * @returns {Object} db operation result
 */
async function updateEdgeTarget(nodeId, item) {
  try {
    let edge = await getOutEdge(nodeId);
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
 * @param {string} nodeId
 * @param {string} itemId
 * @returns
 */
async function deleteEdgeTarget(nodeId, itemId) {
  try {
    let edge = await getOutEdge(nodeId);
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
 * @param {string} nodeId
 * @returns {OutEdge} edge with source=nodeId
 */
async function getOutEdge(nodeId) {
  try {
    let result = await db.find({
      selector: {
        dataType: "edge",
        source: nodeId,
      },
    });
    // each source corresponds to exactly 1 edge data
    return result.docs[0];
  } catch (error) {
    console.log(error);
  }
}

/**
 * Get both inward edges (backward links)
 * @param {string} nodeId
 * @returns {OutEdge[]} edges with targets containing nodeId
 */
async function getInEdges(nodeId) {
  try {
    let result = await db.find({
      selector: {
        dataType: "edge",
        targets: { $in: [nodeId] },
      },
    });
    // there maybe many nodes connecting to this node
    return result.docs;
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
