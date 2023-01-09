import { useStateStore } from "src/stores/appState";
const stateStore = useStateStore();
const storagePath = stateStore.storagePath;
const path = window.path;
const fs = window.fs;

/**
 * Create project folder in storage path
 * @param {string} projectId
 */
function createProjectFolder(projectId) {
  try {
    let projectPath = path.join(storagePath, projectId);
    fs.mkdirSync(projectPath);
  } catch (error) {
    console.log(error);
  }
}

/**
 * Delete the project folder in storage path
 * @param {string} projectId
 */
function deleteProjectFolder(projectId) {
  try {
    let dirPath = path.join(storagePath, projectId);
    fs.rmSync(dirPath, { recursive: true, force: true });
  } catch (error) {
    console.log(error);
  }
}

/**
 * Copy file to the corresponding project folder and returns the new file path
 * @param {string} srcPath
 * @param {string} projectId
 * @returns {string} dstPath
 */
function copyFile(srcPath, projectId) {
  try {
    let fileName = path.basename(srcPath);
    let dstPath = path.join(storagePath, projectId, fileName);
    fs.copyFileSync(srcPath, dstPath);
    return dstPath;
  } catch (error) {
    console.log(error);
  }
}

function renameFile() {}

function deleteFile() {}

export { createProjectFolder, deleteProjectFolder, copyFile };
