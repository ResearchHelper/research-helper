import { db } from "../database";
import axios from "axios";
import { useStateStore } from "src/stores/appState";
import { v4 as uuidv4 } from "uuid";

const stateStore = useStateStore();
const storagePath = stateStore.storagePath;
const path = window.path;
const fs = window.fs;

async function extractContent(data) {
  let res = await axios.post("http://localhost:5000/extract", data);
  return res.data;
}

async function addProject(file) {
  try {
    let projectId = uuidv4();

    // copy the actual file to user data
    let fileName = path.basename(file.path);
    let srcPath = file.path;
    let dstDir = path.join(storagePath, "projects", projectId);
    let dstPath = path.join(dstDir, fileName);
    fs.mkdirSync(dstDir);
    fs.copyFileSync(srcPath, dstPath);

    // add project to db
    let project = await extractContent({
      path: dstPath,
    });
    project._id = projectId;
    project.dataType = "project";
    project.type = "paper";
    project.path = dstPath;
    project.related = []; // related projectIds
    project.tags = [];
    project.notes = []; // noteIds
    // the folders containing the project
    project.folderIds = ["library"];
    if (stateStore.selectedFolderId != "library")
      project.folderIds.push(stateStore.selectedFolderId);
    await db.put(project);

    // return the project
    return await db.get(projectId);
  } catch (err) {
    console.log(err);
  }
}

/**
 *
 * @param {String} projectId
 * @param {Boolean} deleteFromDB
 */
async function deleteProject(projectId, deleteFromDB) {
  try {
    let project = await db.get(projectId);
    if (deleteFromDB) {
      // remove from db
      await db.remove(project);

      // remove related pdf_state and pdf_annotations on db
      let result = await db.find({
        selector: {
          projectId: project._id,
        },
      });
      for (let doc of result.docs) {
        await db.remove(doc);
      }

      // remove the acutual files
      fs.rmSync(path.dirname(project.path), { recursive: true, force: true });
    } else {
      let folderId = stateStore.selectedFolderId;
      project.folderIds = project.folderIds.filter((id) => id != folderId);
      await db.put(project);
    }
  } catch (err) {
    console.log(err);
  }
}

async function updateProject(project) {
  let result = await db.put(project);
  return await db.get(result.id);
}

function getProject(projectId) {
  return db.get(projectId);
}

async function getAllProjects() {
  let result = await db.find({
    selector: {
      dataType: "project",
    },
  });
  return result.docs;
}

/**
 * Get corresponding projects given their ids
 * @param {String} folderId
 * @returns {Array} projects
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
