import Cite from "citation-js";
import "@citation-js/plugin-isbn"; // must import this so we can use isbn as identifier
import { getProjectsByFolderId } from "./project";

/**
 * Get artible/book info given an identifier using citation.js
 * @param {string} identifier
 * @param {string | null} format
 * @returns {any} citation data
 */
async function getMeta(identifier, format = null) {
  try {
    const data = await Cite.async(identifier);
    if (!format) return data.data;
    else return data.format(format);
  } catch (error) {
    console.log(error);
    throw error; // frontend needs display this
  }
}

window.getMeta = getMeta;

/**
 * Export a folder of references to a specific format
 * @param {string} folderId
 * @param {string} format
 * @returns {any} result
 */
async function exportMeta(folderId, format) {
  try {
    let projects = await getProjectsByFolderId(folderId);
    return await getMeta(projects, format);
  } catch (error) {
    console.log(error);
    throw error;
  }
}

/**
 * Given a file, extract meta info, tables, figures and formulas using GROBID
 * @param {string} filePath
 */
async function extractContent(filePath) {
  // TODO
  // Basic functionality
  // extractHeader()
  // VIP functionalities
  // extractTables()
  // extractFigures()
  // extractFormulas()
}

/**
 * extract header (title, author, abstract) from PDF using GROBID
 */
async function extractHeader() {
  // TODO
}

/**
 * extract tables from PDF using GROBID (VIP)
 */
async function extractTables() {
  // TODO
}

/**
 * extract figures from PDF using GROBID (VIP)
 */
async function extractFigures() {
  // TODO
}

/**
 * extract formulas from PDF using GROBID (VIP)
 */
async function extractFormulas() {
  // TODO
}

export { getMeta, exportMeta };
