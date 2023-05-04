import Cite from "citation-js";
import "@citation-js/plugin-isbn"; // must import this so we can use isbn as identifier
import { getProjectsByFolderId } from "./project";
import { exportFile } from "quasar";

import { Folder, Meta, Project } from "../database";

/**
 * Get artible/book info given an identifier using citation.js
 * @param identifier - identifier(s)
 * @param format - json, bib, bibliography, ris, ...
 * @param options - e.g. {format: "html"}, {template: "vancouver"}
 * @returns {any} citation data
 */
async function getMeta(
  identifier: string | string[] | object[],
  format?: string,
  options?: { format?: string; template?: string }
): Promise<any> {
  try {
    const data = await Cite.async(identifier);
    if (!format || format === "json") {
      let metas = data.data;
      for (let i in metas) delete metas[i]._graph;
      return metas;
    } else if (!options) return data.format(format);
    else return data.format(format, options);
  } catch (error) {
    console.log(error);
    throw error; // frontend needs display this
  }
}

(window as any).getMeta = getMeta;

/**
 * Export a folder of references to a specific format
 * @param {import("./folder").Folder} folder
 * @param {string} format
 */
async function exportMeta(
  folder: Folder,
  format: string,
  options: { format?: string; template?: string }
) {
  try {
    let projects: Project[] = await getProjectsByFolderId(folder._id);
    console.log("projects", projects);
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
async function importMeta(filePath: string): Promise<any> {
  let data = window.fs.readFileSync(filePath, "utf8");
  return await getMeta(data, "json");
}

export { getMeta, exportMeta, importMeta };
