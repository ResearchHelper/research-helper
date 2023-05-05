import { db, AppState } from "../database";

const path = window.path;
const fs = window.fs;

/**
 * Get storagePath from database
 * @returns storagePath
 */
async function storagePath(): Promise<string> {
  let state: AppState = await db.get("appState");
  return state.settings.storagePath;
}

/**
 * Create project folder in storage path
 * @param projectId
 */
async function createProjectFolder(projectId: string) {
  try {
    if (!path || !fs) return;
    let projectPath = path.join(await storagePath(), projectId);
    fs.mkdirSync(projectPath);
  } catch (error) {
    console.log(error);
  }
}

/**
 * Delete the project folder in storage path
 * @param projectId
 */
async function deleteProjectFolder(projectId: string) {
  try {
    if (!path || !fs) return;
    let dirPath = path.join(await storagePath(), projectId);
    fs.rmdirSync(dirPath, { recursive: true });
  } catch (error) {
    console.log(error);
  }
}

/**
 * Copy file to the corresponding project folder and returns the new file path
 * @param srcPath
 * @param projectId
 * @returns dstPath
 */
async function copyFile(
  srcPath: string,
  projectId: string
): Promise<string | undefined> {
  try {
    if (!path || !fs) return;
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
 * @param projectId
 * @param fileName - the created file's name
 * @returns filePath - the created file's path
 */
async function createFile(
  projectId: string,
  fileName: string
): Promise<string | undefined> {
  try {
    if (!path || !fs) return;
    let filePath = path.join(await storagePath(), projectId, fileName);
    fs.closeSync(fs.openSync(filePath, "w"));
    return filePath;
  } catch (error) {
    console.log(error);
  }
}

/**
 * Delete file
 * @param filePath
 */
function deleteFile(filePath: string) {
  try {
    if (!fs) return;
    // we can ignore this error since rmSync is there
    fs.rmSync(filePath, { force: true });
  } catch (error) {
    console.log(error);
  }
}

/**
 * Rename a file
 * @param filePath - path to file
 * @param fileName - new file name
 */
function renameFile(filePath: string, fileName: string) {
  try {
    if (!path || !fs) return;
    let dirname = path.dirname(filePath);
    let newPath = path.join(dirname, fileName.replace("/", ""));
    fs.renameSync(filePath, newPath);
    return newPath;
  } catch (error) {
    console.log(error);
  }
}

/**
 * Move folder
 * @param srcPath source path
 * @param dstPath destination path
 */
function changePath(srcPath: string, dstPath: string): Error | undefined {
  try {
    if (!fs) return;
    fs.renameSync(srcPath, dstPath);
  } catch (error) {
    console.log(error);
    return error as Error;
  }
}

export {
  createProjectFolder,
  deleteProjectFolder,
  copyFile,
  createFile,
  deleteFile,
  renameFile,
  changePath,
};
