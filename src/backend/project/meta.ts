import Cite from "citation-js";
import "@citation-js/plugin-isbn"; // must import this so we can use isbn as identifier
import { getProjects } from "./project";
import { exportFile } from "quasar";

import { Author, Folder, Meta, Project } from "../database";

/**
 * Get artible/book info given an identifier using citation.js
 * @param identifier - identifier(s)
 * @param format - json, bib, bibliography, ris, ...
 * @param options - e.g. {format: "html"}, {template: "vancouver"}
 * @returns citation data
 */
export async function getMeta(
  identifier: string | string[] | object[],
  format?: string,
  options?: { format?: string; template?: string }
): Promise<Meta | undefined> {
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
  }
}

(window as any).getMeta = getMeta;

/**
 * Export a folder of references to a specific format
 * @param folder
 * @param format
 * @param options
 */
export async function exportMeta(
  folder: Folder,
  format: string,
  options: { format?: string; template?: string }
) {
  try {
    let projects: Project[] = await getProjects(folder._id);
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
 * @param filePath
 * @returns citation data
 */
export async function importMeta(filePath: string): Promise<Meta | undefined> {
  let data = window.fs.readFileSync(filePath, "utf8");
  return await getMeta(data, "json");
}

/**
 * Generate citation-key according to given meta
 * @param meta
 */
export function generateCiteKey(
  meta: Meta,
  rule: {
    connector1: "_";
    connector2: "_";
    nameConnector: "_";
    part1: "name";
    part2: "title";
    part3: "year";
  }
): string {
  let parts = { name: "", year: "", title: "" };
  // author
  let lastNames = "unknown";
  if (meta.author.length > 0) {
    let familyNames = [];
    for (let author of meta.author as Author[]) {
      if (familyNames.length === 2) {
        // the third author and other will be briviated as etal
        familyNames.push("etal");
        break;
      }

      let family = author?.family;
      let literal = author?.literal;
      if (family) familyNames.push(family);
      else if (literal) {
        // split the name by two ways "first last" and "last, feng"
        literal = literal.trim();
        let split1 = literal.split(" ");
        let split2 = literal.split(",");
        if (split1.length > 1) familyNames.push(split1[1].trim());
        else if (split2.length > 1) familyNames.push(split2[0].trim());
        else familyNames.push(literal);
      }
    }

    lastNames = familyNames.join(rule.nameConnector);
  }
  parts["name"] = lastNames;

  // year
  let year = "unknown";
  if (meta.issued) year = meta.issued["date-parts"][0][0].toString();
  parts.year = year;

  // title's first word
  let word = meta.title
    .split(" ")
    .filter((w) => !["a", "an", "the"].includes(w.toLowerCase()))[0];
  parts.title = word;

  let key =
    parts[rule.part1] +
    rule.connector1 +
    parts[rule.part2] +
    rule.connector2 +
    parts[rule.part3];
  return key;
}
