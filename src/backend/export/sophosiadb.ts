import { getAppState, getLayout } from "../appState";
import { getFolders } from "../project/folder";
import { getAllProjects, getProjects } from "../project/project";
import { AnnotationData, Note, NoteType, PDFState, db } from "../database";
import { customAlphabet } from "nanoid";
import { getAllNotes, getNotes, loadNote, saveNote } from "../project/note";
import { authorToString } from "../project/utils";
import { i18n } from "src/boot/i18n";
const { t } = i18n.global;
const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 8);

const fs = window.fs;
const path = window.path;

function createHiddenFolder(storagePath: string) {
  try {
    const paths = {
      storagePath: "",
      sophosia: "",
      appState: "",
      layout: "",
      project: "",
      folder: "",
      pdfAnnotation: "",
      pdfState: "",
      image: "",
    } as { [k: string]: string };
    let sophosia = path.join(storagePath, ".sophosia");
    if (!fs.existsSync(sophosia)) {
      fs.mkdirSync(sophosia);
      paths.sophosia = sophosia;
    }
    for (let folder of [
      "appState",
      "layout",
      "project",
      "folder",
      "pdfAnnotation",
      "pdfState",
      "image",
    ]) {
      let folderPath = path.join(sophosia, folder);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
        paths[folder] = folderPath;
      }
    }
    return paths;
  } catch (error) {
    console.log(error);
  }
}

/**
 * In the newStoragePath
 * create hidden folders and prepare all json files
 * @param newStoragePath
 */
export async function exportDB(
  storagePath: string,
  progressCallback: (progress: number) => void
) {
  try {
    const folderPaths = await createHiddenFolder(storagePath);
    if (!folderPaths) return;
    let jsonPath = "";
    const state = await getAppState();
    const layout = await getLayout();
    const folders = await getFolders();
    const projects = await getAllProjects();
    const notes = await getAllNotes();
    const pdfStates = (
      await db.find({
        selector: { dataType: "pdfState" },
      })
    ).docs as PDFState[];
    const annotDatas = (
      await db.find({
        selector: { dataType: "pdfAnnotation" },
      })
    ).docs as AnnotationData[];

    const totalSteps =
      2 +
      folders.length +
      projects.length +
      notes.length +
      pdfStates.length +
      annotDatas.length;
    let currentStep = 0;

    // convert oldId to newId
    const old2new = new Map<string, string>();

    // app state
    const oldStoragePath = state.settings.storagePath;
    delete (state as { _rev?: string })._rev;
    jsonPath = path.join(folderPaths.appState, "appState.json");
    fs.writeFileSync(jsonPath, JSON.stringify(state));
    currentStep++;
    progressCallback(currentStep / totalSteps);

    // layout
    delete (layout as { _rev?: string })._rev;
    jsonPath = path.join(folderPaths.layout, "layout.json");
    fs.writeFileSync(jsonPath, JSON.stringify(layout));
    currentStep++;
    progressCallback(currentStep / totalSteps);

    // folder
    for (const folder of folders) {
      delete (folder as { _rev?: string })._rev;
      const oldFolderId = folder._id;
      folder._id = "SF" + (folder._id === "library" ? "library" : nanoid());
      folder.icon = folder._id === "SFlibrary" ? "mdi-bookshelf" : "mdi-folder";
      old2new.set(oldFolderId, folder._id);
    }

    // update folderIds in the children
    for (const folder of folders) {
      for (const [ind, oldId] of folder.children.entries())
        folder.children[ind] = old2new.get(oldId as string) as string;
      jsonPath = path.join(folderPaths.folder, folder._id + ".json");
      fs.writeFileSync(jsonPath, JSON.stringify(folder));

      currentStep++;
      progressCallback(currentStep / totalSteps);
    }

    // project
    for (const project of projects) {
      delete (project as { _rev?: string })._rev;
      const oldProjectId = project._id;
      project._id = "SP" + nanoid();
      old2new.set(oldProjectId, project._id);
      project.folderIds = project.folderIds.map(
        (oldId) => old2new.get(oldId) || oldId
      );
      // create new project folder in the new storage path and move all stuff to there
      const oldProjectFolder = path.join(oldStoragePath, oldProjectId);
      const projectFolder = path.join(storagePath, project._id);
      fs.mkdirSync(projectFolder);
      // process the pdf, image files and notes
      // copy the pdf file into new folder regardless the pdf is linked or in the project folder
      if (project.path) {
        const oldPDFPath = project.path;
        const newPDFPath = path.join(projectFolder, path.basename(oldPDFPath));
        fs.copyFileSync(oldPDFPath, newPDFPath);
        delete project.path;
        project.pdf = path.basename(newPDFPath);
      }
      const entries = fs.readdirSync(oldProjectFolder);
      for (const entry of entries) {
        if (entry === "img") {
          // image
          const imgFolder = path.join(oldStoragePath, oldProjectId, "img");
          const imgs = fs.readdirSync(imgFolder);
          for (const img of imgs) {
            const imgId = "SI" + nanoid() + path.extname(img);
            old2new.set(img, imgId);
            const oldPath = path.join(imgFolder, img);
            const newPath = path.join(folderPaths.image, imgId);
            fs.copyFileSync(oldPath, newPath);
          }
        } else if (path.extname(entry) === ".pdf") {
          // no need to do anything
        } else {
          // notes: md, and excalidraw
          const ext = path.extname(entry); // ext has the .
          const oldFilePath = path.join(oldProjectFolder, entry);
          const note = notes.find((note) => note._id + ext === entry) as Note;
          const newNoteId = `${project._id}/${note.label}${ext}`;
          let newFilePath = path.join(projectFolder, `${note.label}${ext}`);
          let i = 1;
          while (fs.existsSync(newFilePath)) {
            note._id = `${project._id}/${note.label} ${i}${ext}`;
            newFilePath = path.join(projectFolder, `${note.label} ${i}${ext}`);
            i++;
          }
          old2new.set(note._id, newNoteId);
          // change the properties of note, we will use them later
          // keep note._id as oldId, we will use this later
          note.path = newFilePath;
          fs.copyFileSync(oldFilePath, newFilePath);
        }
      }
      // save project data
      jsonPath = path.join(folderPaths.project, project._id + ".json");
      fs.writeFileSync(jsonPath, JSON.stringify(project));

      // create a folder note under the same folder
      const content = `# ${project.label}
${t("author")}: ${authorToString(project.author)}
${t("abstract")}: ${project.abstract || ""}

${t("note-is-auto-manged")}`;
      fs.writeFileSync(path.join(projectFolder, project._id + ".md"), content);

      currentStep++;
      progressCallback(currentStep / totalSteps);
    }

    // notes (change links)
    for (const note of notes) {
      if (note.type !== NoteType.MARKDOWN) continue;
      let content = await loadNote("", note.path);
      for (const [oldId, newId] of old2new.entries()) {
        if (newId.includes("SF")) continue;
        else if (newId.includes("SI")) {
          // change links to image
          // id is too long to create regex
          // const regex = new RegExp(`[\\w\/\.\\]*${oldId}`, "gm");
          content = content
            .replaceAll(`./img/${oldId}`, newId) // must place before the next statement
            .replaceAll(oldId, newId);
        } else if (newId.includes("/")) {
          // change links to note
          content = content.replaceAll(oldId, newId.replaceAll(" ", "%20"));
        } else {
          // change links to project
          content = content.replaceAll(oldId, newId);
        }
      }
      await saveNote("", content, note.path);

      currentStep++;
      progressCallback(currentStep / totalSteps);
    }

    // pdfstate
    for (const pdfState of pdfStates) {
      delete (pdfState as { _rev?: string })._rev;
      pdfState._id = "SS" + old2new.get(pdfState.projectId)!.slice(2);
      jsonPath = path.join(
        folderPaths.pdfState,
        old2new.get(pdfState.projectId) + ".json"
      );
      fs.writeFileSync(jsonPath, JSON.stringify(pdfState));

      currentStep++;
      progressCallback(currentStep / totalSteps);
    }

    // pdfAnnotation
    for (const annotData of annotDatas) {
      delete (annotData as { _rev?: string })._rev;
      annotData._id = "SA" + nanoid();
      annotData.projectId = old2new.get(annotData.projectId) as string;
      jsonPath = path.join(folderPaths.pdfAnnotation, annotData._id + ".json");
      fs.writeFileSync(jsonPath, JSON.stringify(annotData));

      currentStep++;
      progressCallback(currentStep / totalSteps);
    }
  } catch (error) {
    console.log(error);
  }
}
