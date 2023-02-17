import Cite from "citation-js";
import "@citation-js/plugin-isbn"; // must import this so we can use isbn as identifier
import { getProjectsByFolderId } from "./project";
import { exportFile } from "quasar";

/**
 * Get artible/book info given an identifier using citation.js
 * @param {string} identifier
 * @param {string | null} format
 * @returns {any} citation data
 */
async function getMeta(identifier, format, options = null) {
  try {
    const data = await Cite.async(identifier);
    if (format === "json") return data.data;
    else if (!options) return data.format(format);
    else return data.format(format, options);
  } catch (error) {
    console.log(error);
    throw error; // frontend needs display this
  }
}

window.getMeta = getMeta;

/**
 * Export a folder of references to a specific format
 * @param {import("./folder").Folder} folder
 * @param {string} format
 */
async function exportMeta(folder, format, options = null) {
  try {
    let projects = await getProjectsByFolderId(folder._id);
    let meta = await getMeta(projects, format, options);
    if (format === "json") {
      exportFile(`${folder.label}.json`, JSON.stringify(meta), {
        mimeType: "application/json",
      });
    } else {
      let extension = "";
      if (["bibtex", "biblatex"].includes(format)) extension = "bib";
      else if (format === "bibliography") extension = "txt";
      else if (format === "ris") extension = "ris";
      exportFile(`${folder.label}.${extension}`, meta, {
        mimeType: "text/plain",
      });
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
}

/**
 *
 * @param {string} filePath
 * @returns {any} citation data
 */
async function importMeta(filePath) {
  let data = window.fs.readFileSync(filePath, "utf8");
  return await getMeta(data, "json");
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

export { getMeta, exportMeta, importMeta };
