import { db, Meta, Project, SpecialFolder } from "../database";
import { uid } from "quasar";
import { createProjectFolder, deleteProjectFolder } from "./file";

/**
 * Add empty projet to database, creates project folder and returns the project
 * The project is added to folder with folderId
 * @param {string} folderId
 * @returns {Project} project
 */
async function addProject(folderId: string): Promise<Project | void> {
  try {
    // create empty project entry
    let project = {
      _id: uid(),
      _rev: "",
      timestampAdded: Date.now(),
      timestampModified: Date.now(),
      dataType: "project",
      label: "New Project",
      title: "New Project",
      path: "",
      tags: [] as string[],
      folderIds: ["library"],
    } as Project;
    if (folderId != "library") project.folderIds.push(folderId);

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
async function deleteProject(
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
 * @param {Project} project
 * @returns {Project} updated project
 */
async function updateProject(project: Project): Promise<Project | undefined> {
  try {
    let oldProject = await db.get(project._id);
    project._rev = oldProject._rev;
    project.timestampModified = Date.now();
    project.label = project.title; // also update label
    let result = await db.put(project);
    project._rev = result.rev;
    return project;
  } catch (error) {
    console.log(error);
  }
}

/**
 * Modify the meta of a project
 * @param {Project} project
 * @param {Object} meta
 * @returns {Project} modifiedProject
 */
async function updateProjectByMeta(
  project: Project,
  meta: Meta & { _graph?: Array<any> }
) {
  // also update ui label
  project.label = project.title;
  // update meta
  delete meta._graph; // this can't go into database
  Object.assign(project, meta);
  return await updateProject(project);
}

/**
 * Get project from database by projectId
 * @param {string} projectId
 * @returns {Project|undefined} project
 */
async function getProject(projectId: string): Promise<Project | undefined> {
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
async function getAllProjects(): Promise<Project[]> {
  let result = await db.find({
    selector: {
      dataType: "project",
    },
  });
  return result.docs as Project[];
}

/**
 * Get corresponding projects given the ID of folder containing them
 * @param {string} folderId
 * @returns {Array} array of projects
 */
async function getProjectsByFolderId(folderId: string): Promise<Project[]> {
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
}

export {
  addProject,
  deleteProject,
  updateProject,
  updateProjectByMeta,
  getProjectsByFolderId,
  getProject,
  getAllProjects,
};
