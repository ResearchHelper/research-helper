import Cite from "citation-js";

/**
 * Get artible/book info given an identifier using citation.js
 * @param {string} identifier
 * @returns {Object} json data
 */
async function getMeta(identifier) {
  const data = await Cite.async(identifier);
  return data.data;
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

export { getMeta };
