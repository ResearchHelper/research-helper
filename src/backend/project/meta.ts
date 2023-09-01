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
): Promise<Meta[] | string> {
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
    return [] as Meta[];
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
    let metas = await getMeta(projects, format, options);
    if (format === "json") {
      exportFile(`${folder.label}.json`, JSON.stringify(metas), {
        mimeType: "application/json",
      });
    } else {
      let extension = "";
      if (["bibtex", "biblatex"].includes(format)) extension = "bib";
      else if (format === "bibliography") extension = "txt";
      else if (format === "ris") extension = "ris";
      exportFile(`${folder.label}.${extension}`, metas as string, {
        mimeType: "text/plain",
      });
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
}

/**
 * Read a reference file (such as .bib) and return the containing metas
 * @param filePath
 * @returns citation data
 */
export async function importMeta(filePath: string): Promise<Meta[]> {
  let data = window.fs.readFileSync(filePath, "utf8");
  return (await getMeta(data, "json")) as Meta[];
}

/**
 * Generate citation-key according to given meta
 * @param meta
 * @param rule - example: "author_title_year", "author year title" (space means no connector in between) ...
 */
export function generateCiteKey(
  meta: Meta,
  rule = "author-title-year",
  longTitle = false
): string {
  // parsing the rule
  let connector = "";
  let keys = ["author", "title", "year"];
  for (let symbol of [" ", "-", "_", "."]) {
    keys = rule.split(symbol);
    if (keys[0] && keys[1] && keys[2]) {
      connector = symbol;
      break;
    }
  }

  let parts = { author: "", year: "", title: "" };
  // author
  let lastNames = "unknown";
  if (meta.author && meta.author.length > 0) {
    let familyNames = [];
    for (let author of meta.author as Author[]) {
      if (familyNames.length === 2) {
        // the third author and other will be briviated as etal
        familyNames.push("etal");
        break;
      }

      let family = author?.family;
      let literal = author?.literal;
      if (family) familyNames.push(family.toLowerCase());
      else if (literal) {
        // split the name by two ways "first last" and "last, feng"
        literal = literal.trim();
        let split1 = literal.split(" ");
        let split2 = literal.split(",");
        if (split1.length > 1) familyNames.push(split1[1].trim().toLowerCase());
        else if (split2.length > 1)
          familyNames.push(split2[0].trim().toLowerCase());
        else familyNames.push(literal.toLowerCase());
      }
    }

    lastNames = familyNames.join(connector);
  }
  parts.author = lastNames;

  // year
  let year = "unknown";
  if (meta.issued) year = meta.issued["date-parts"][0][0].toString();
  parts.year = year;

  if (longTitle) {
    parts.title = meta.title.toLowerCase().split(" ").join(connector);
  } else {
    // title's first word
    let title = meta.title
      .split(" ")
      .filter((w) => !["a", "an", "the", "on"].includes(w.toLowerCase()))[0];
    parts.title = title.toLowerCase();
  }

  let citeKey = keys
    .map((key) => parts[key as "year" | "author" | "title"])
    .join(connector);

  // if connector is " ", it means no connector in between
  // connect all parts to a Pascal Case string
  if (connector === " ") {
    citeKey = citeKey
      .replace(
        /(\w)(\w*)/g,
        (_, g1: string, g2: string) => g1.toUpperCase() + g2
      )
      .replaceAll(" ", "");
  }
  return citeKey;
}
