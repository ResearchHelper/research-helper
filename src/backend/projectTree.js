import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { useStateStore } from "src/stores/appState";
const stateStore = useStateStore();
const storagePath = stateStore.storagePath;
// I have to load these libraries using contextBridge, otherwise they are externalized
const path = window.path;
const fs = window.fs;

// local storage
/**
 *
 * @param {Array} projects
 * @returns {Array} projectTree
 */
function getProjectTree(projects) {
  if (!storagePath) {
    return [];
  }
  // TODO: do I really need this?
  // since files are already in the project info
}

function saveTree() {
  if (!storagePath) {
    return;
  }

  let filePath = path.join(storagePath, "folderTree.json");
  fs.writeFileSync(filePath, JSON.stringify(stateStore.folders));
}

async function addProject(files) {
  for (let file of files) {
    let data = {
      path: file.path,
      projectId: uuidv4(),
      projectType: "paper",
    };

    let meta = await extractContent(data);
    // push id to library folder and current folder
    stateStore.folders[0].projectIds.push(meta.projectId);
    stateStore.selectedTreeNode.projectIds.push(meta.projectId);
  }
  saveTree();
}

function deleteProject(deleteFromDB) {
  if (deleteFromDB === true) {
    let dirPath = path.join(
      storagePath,
      "projects",
      stateStore.selectedProject.projectId
    );
    fs.rmSync(dirPath, { recursive: true, force: true });
  }

  // update folderTree.json
  // update projectIds in the current folder
  let node = stateStore.selectedTreeNode;
  node.projectIds = node.projectIds.filter(
    (projectId) => projectId !== stateStore.selectedProject.projectId
  );
  // also need to update projectIds in library
  stateStore.folders[0].projectIds = stateStore.folders[0].projectIds.filter(
    (projectId) => projectId !== stateStore.selectedProject.projectId
  );
  saveTree();
}

function getProject(projectId) {
  let dirPath = path.join(storagePath, "projects", projectId);
  let metaPath = path.join(dirPath, "info.json");
  let project = JSON.parse(fs.readFileSync(metaPath, "utf8"));

  // get files in this project
  let files = fs.readdirSync(dirPath);
  project.files = files;
  return project;
}

function modifyProject(projectId, data) {
  let dirPath = path.join(storagePath, "projects", projectId);
  let metaPath = path.join(dirPath, "info.json");
  fs.writeFileSync(metaPath, JSON.stringify(data));
}

// api
async function extractContent(data) {
  let res = await axios.post("http://localhost:5000/extract", data);
  return res.data;
}

export {
  loadTree,
  saveTree,
  addProject,
  deleteProject,
  getProject,
  modifyProject,
  extractContent,
};