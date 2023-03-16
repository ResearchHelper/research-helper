import { db } from "../database";

const path = window.path;
const fs = window.fs;

/**
 * Get storagePath from database
 * @returns {string} storagePath
 */
async function storagePath() {
  let state = await db.get("appState");
  return state.settings.storagePath;
}

/**
 * Create project folder in storage path
 * @param {string} projectId
 */
async function createProjectFolder(projectId) {
  try {
    let projectPath = path.join(await storagePath(), projectId);
    fs.mkdirSync(projectPath);
  } catch (error) {
    console.log(error);
  }
}

/**
 * Delete the project folder in storage path
 * @param {string} projectId
 */
async function deleteProjectFolder(projectId) {
  try {
    let dirPath = path.join(await storagePath(), projectId);
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
async function copyFile(srcPath, projectId) {
  try {
    let fileName = path.basename(srcPath);
    let dstPath = path.join(await storagePath(), projectId, fileName);
    fs.copyFileSync(srcPath, dstPath);
    return dstPath;
  } catch (error) {
    console.log(error);
  }
}

/**
 * Create a file inside project folder
 * @param {string} projectId
 * @param {string} fileName
 * @returns {string} filePath
 */
async function createFile(projectId, fileName) {
  try {
    let filePath = path.join(await storagePath(), projectId, fileName);
    fs.closeSync(fs.openSync(filePath, "w"));
    return filePath;
  } catch (error) {
    console.log(error);
  }
}

/**
 * Delete file
 * @param {string} filePath
 */
function deleteFile(filePath) {
  try {
    fs.rmSync(filePath, { force: true });
  } catch (error) {
    console.log(error);
  }
}

/**
 * Rename a file
 * @param {string} filePath - path to file
 * @param {string} fileName - new file name
 * @param {string} newPath - new path to file
 */
function renameFile(filePath, fileName) {
  try {
    console.log("here");
    let dirname = path.dirname(filePath);
    let newPath = path.join(dirname, fileName);
    fs.renameSync(filePath, newPath);
    return newPath;
  } catch (error) {
    console.log(error);
  }
}

/**
 * Move folder
 * @param {string} srcPath source path
 * @param {string} dstPath destination path
 */
function moveFolder(srcPath, dstPath) {
  try {
    fs.renameSync(srcPath, dstPath);
  } catch (error) {
    console.log(error);
  }
}

export {
  createProjectFolder,
  deleteProjectFolder,
  copyFile,
  createFile,
  deleteFile,
  renameFile,
  moveFolder,
};
