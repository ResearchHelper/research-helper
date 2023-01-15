import { db } from "../database";
import { uid } from "quasar";
import { createProjectFolder, deleteProjectFolder } from "./file";

/**
 * Project data
 * @typedef {Object} Project
 * @property {string} _id - unique id
 * @property {string} _rev - data version handled by database
 * @property {string} dataType - "project" (used for database search)
 * @property {string} type - article / book / conference-paper ...
 * @property {string} title - article / book title
 * @property {Array} author - array of authors [{family: "Feng", given: "Feng"}, {literal: "John"}]
 * @property {string} abstract - article abstract
 * @property {string} DOI - Digital Object Identity
 * @property {string} ISBN - ISBN of a book
 * @property {string} URL - URL to this article/book
 * @property {string} publisher - publisher
 * @property {Array} tags - user defined keywords for easier search
 * @property {Array} related - array of related projectIDs
 * @property {Array} folderIds - array of folderIDs containing this project
 */

/**
 * Add empty projet to database, creates project folder and returns the project
 * The project is added to folder with folderId
 * @param {string} folderId
 * @returns {Project} project
 */
async function addProject(folderId) {
  try {
    // create empty project entry
    let project = {};
    project._id = uid();
    project.dataType = "project";
    project.type = "";
    project.title = "New Project";
    project.author = [];
    project.abstract = "";
    project.DOI = "";
    project.URL = "";
    project.ISBN = "";
    project.publisher = "";
    project.related = []; // related projectIds
    project.tags = [];
    project.folderIds = ["library"]; // the folders containing the project
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
 */
async function deleteProject(projectId, deleteFromDB) {
  try {
    let project = await db.get(projectId);
    if (deleteFromDB) {
      // remove from db
      await db.remove(project);

      // remove related pdf_state, pdf_annotations and notes on db
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
      let folderId = stateStore.selectedFolderId;
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
async function updateProject(project) {
  let result = await db.put(project);
  return await db.get(result.id);
}

/**
 * Get project from database by projectId
 * @param {string} projectId
 * @returns {Project} project
 */
function getProject(projectId) {
  try {
    return db.get(projectId);
  } catch (error) {
    console.log(error);
  }
}

/**
 * Get all projects from database
 * @returns {Array} array of projects
 */
async function getAllProjects() {
  let result = await db.find({
    selector: {
      dataType: "project",
    },
  });
  return result.docs;
}

/**
 * Get corresponding projects given the ID of folder containing them
 * @param {string} folderId
 * @returns {Array} array of projects
 */
async function getProjectsByFolderId(folderId) {
  let result = await db.find({
    selector: {
      folderIds: { $in: [folderId] },
    },
  });

  return result.docs;
}

export {
  addProject,
  deleteProject,
  updateProject,
  getProjectsByFolderId,
  getProject,
  getAllProjects,
};
