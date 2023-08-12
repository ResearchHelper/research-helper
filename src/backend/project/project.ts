import { db, Project, SpecialFolder } from "../database";
import {
  copyFile,
  createProjectFolder,
  deleteProjectFolder,
  renameFile,
} from "./file";

/**
 * Add empty projet to database, creates project folder and returns the project
 * The project is added to folder with folderId
 * @param project
 * @returns project
 */
export async function addProject(
  project: Project
): Promise<Project | undefined> {
  try {
    // need to remomve _graph property if update by meta
    delete project._graph;

    // create actual folder for containing its files
    await createProjectFolder(project._id);

    // put entry to database
    let result = await db.put(project);
    project._rev = result.rev;

    return project; // return the project
  } catch (err) {
    console.log(err);
  }
}

/**
 * Delete project from a folder.
 * If deleteFromDB is true, delete the project from all folders
 * and remove the actual folder containing the project files in storage path
 * @param {string} projectId
 * @param {boolean} deleteFromDB
 * @param {string} folderId - if deleteFromDB === false, then we need folderId
 */
export async function deleteProject(
  projectId: string,
  deleteFromDB: boolean,
  folderId?: string
) {
  try {
    let project: Project = await db.get(projectId);
    if (deleteFromDB) {
      // remove from db
      await db.remove(project as PouchDB.Core.RemoveDocument);

      // remove related pdfState, pdfAnnotation and notes on db
      let result = await db.find({
        selector: {
          projectId: project._id,
        },
      });
      for (let doc of result.docs) {
        await db.remove(doc);
      }

      // remove the acutual files
      // (do not rely on project.path because it might be empty)
      await deleteProjectFolder(projectId);
    } else {
      if (folderId === undefined) throw new Error("folderId is needed");
      project.folderIds = project.folderIds.filter((id) => id != folderId);
      await db.put(project);
    }
  } catch (err) {
    console.log(err);
  }
}

/**
 * Update project in database and returns the updated project
 * @param project
 * @returns updated project
 */
export async function updateProject(
  projectId: string,
  props: Project
): Promise<Project | undefined> {
  try {
    // need to remomve _graph property if update by meta
    delete props._graph;
    let project = (await db.get(projectId)) as Project;
    props._rev = project._rev;
    props.timestampModified = Date.now();
    Object.assign(project, props);
    project.label = project.title; // also update label
    let result = await db.put(project);
    project._rev = result.rev;
    return project;
  } catch (error) {
    console.log(error);
  }
}

/**
 * Get project from database by projectId
 * @param {string} projectId
 * @returns {Project|undefined} project
 */
export async function getProject(
  projectId: string
): Promise<Project | undefined> {
  try {
    return await db.get(projectId);
  } catch (error) {
    console.log(error);
  }
}

/**
 * Get all projects from database
 * @returns {Project[]} array of projects
 */
export async function getAllProjects(): Promise<Project[]> {
  let result = await db.find({
    selector: {
      dataType: "project",
    },
  });
  return result.docs as Project[];
}

/**
 * Get corresponding projects given the ID of folder containing them
 * @param folderId
 * @returns array of projects
 */
export async function getProjects(folderId: string): Promise<Project[]> {
  try {
    let projects = [] as Project[];
    switch (folderId) {
      case SpecialFolder.LIBRARY:
        projects = (
          await db.find({
            selector: { dataType: "project" },
          })
        ).docs as Project[];
        break;
      case SpecialFolder.ADDED:
        let date = new Date();
        // get recently added project in the last 30 days
        let timestamp = date.setDate(date.getDate() - 30);
        projects = (
          await db.find({
            selector: {
              dataType: "project",
              timestampAdded: {
                $gt: timestamp,
              },
            },
          })
        ).docs as Project[];
        // sort projects in descending order
        projects.sort((a, b) => b.timestampAdded - a.timestampAdded);
        break;
      case SpecialFolder.FAVORITES:
        projects = (
          await db.find({
            selector: {
              dateType: "project",
              favorite: true,
            },
          })
        ).docs as Project[];
        break;
      default:
        projects = (
          await db.find({
            selector: {
              dataType: "project",
              folderIds: { $in: [folderId] },
            },
          })
        ).docs as Project[];
        break;
    }
    // TODO: remove this few more versions later
    let flag = false;
    for (let project of projects)
      if (!project.timestampAdded) {
        project.timestampAdded = Date.now();
        project.timestampModified = Date.now();
        flag = true;
      }
    if (flag) {
      let responses = await db.bulkDocs(projects);
      for (let i in responses) {
        let rev = responses[i].rev;
        if (rev) projects[i]._rev = rev;
      }
    }
    return projects;
  } catch (error) {
    console.log(error);
    return [];
  }
}

export async function renamePDF(project: Project) {
  if (project.path === undefined) return;
  let author = "";
  let year = project.issued?.["date-parts"][0][0] || "Unknown";
  let title = project.title;
  let extname = window.path.extname(project.path);
  if (!project.author || project.author.length === 0) {
    // no author
    author = "Unknown";
  } else {
    // 1 author
    let author0 = project.author[0];
    author = !!author0.family ? author0.family : (author0.literal as string);

    // more than 1 authors
    if (project.author.length > 1) author += " et al.";
  }
  let fileName = `${author} - ${year} - ${title}${extname}`;

  // update backend
  let newPath = renameFile(project.path, fileName);
  return await updateProject(project._id, { path: newPath } as Project);
}

/**
 * Attach a PDF file
 * @param replaceStoredCopy
 */
export async function attachPDF(projectId: string, replaceStoredCopy: boolean) {
  let filePaths = window.fileBrowser.showFilePicker({
    multiSelections: false,
    filters: [{ name: "*.pdf", extensions: ["pdf"] }],
  });
  if (filePaths?.length === 1) {
    let dstPath = filePaths[0];
    if (replaceStoredCopy)
      dstPath = (await copyFile(dstPath, projectId)) as string;
    return await updateProject(projectId, { path: dstPath } as Project);
  }
}
