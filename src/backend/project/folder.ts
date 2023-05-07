import { db, Folder } from "../database";
import { sortTree } from "./utils";

/**
 * Get the folder tree
 * @returns tree
 */
async function getFolderTree(): Promise<Folder[] | undefined> {
  try {
    let result = await db.find({
      selector: {
        dataType: "folder",
      },
    });
    let docs = result.docs;

    // no folders in db yet
    if (docs.length == 0) {
      // create library folder for user if there is none
      let library = {
        _id: "library",
        _rev: "",
        label: "Library",
        icon: "home",
        children: [],
        dataType: "folder",
      } as Folder;
      await db.put(library);
      return [library];
    }

    // create a dict for later use
    let folders: { [k: string]: Folder } = {};
    for (let doc of docs) folders[doc._id] = doc as Folder;

    // create tree using depth first search
    function _dfs(root: Folder, folderTreeRoot: Folder) {
      Object.assign(folderTreeRoot, root);
      folderTreeRoot.children = [];
      for (let [i, childId] of root.children.entries()) {
        folderTreeRoot.children.push({} as Folder);
        _dfs(folders[childId as string], folderTreeRoot.children[i] as Folder);
      }
    }

    let tree = {} as Folder;
    _dfs(folders["library"], tree);
    sortTree(tree);

    return [tree];
  } catch (err) {
    console.log(err);
  }
}

/**
 * Add a subfolder to parent folder
 * @param parentId - parent folder id
 */
async function addFolder(parentId: string) {
  try {
    // add to database
    let result = await db.post({
      label: "New Folder",
      icon: "folder",
      children: [],
      dataType: "folder",
    });
    let node: Folder = await db.get(result.id);

    // push to children of parent Node
    let parentNode: Folder = await db.get(parentId);
    parentNode.children.push(node._id);
    await updateFolder(parentId, { children: parentNode.children } as Folder);

    return node;
  } catch (err) {
    console.log(err);
  }
}

/**
 * Update folder properties
 * @param folderId
 * @param props - Folder
 */
async function updateFolder(folderId: string, props: Folder) {
  try {
    let folder: Folder = await db.get(folderId);
    props._rev = folder._rev;
    Object.assign(folder, props);
    let result = await db.put(folder);
    folder._rev = result.rev;
    return folder;
  } catch (error) {
    console.log(error);
  }
}

/**
 * Delete a folder
 * @param folderId
 */
async function deleteFolder(folderId: string) {
  try {
    // delete from children of parent folder
    let result = await db.find({
      selector: { children: { $in: [folderId] } },
    });
    let parentNode = result.docs[0] as Folder;
    parentNode.children = parentNode.children.filter((id) => id != folderId);
    await db.put(parentNode);

    // delete subfolders using dfs
    result = await db.find({
      selector: {
        dataType: "folder",
      },
    });
    let docs = result.docs;

    // create a dict for later use
    let folders: { [key: string]: Folder } = {};
    for (let doc of docs) folders[doc._id] = doc as Folder;

    function _dfs(root: Folder) {
      db.remove(root as PouchDB.Core.RemoveDocument);
      for (let childId of root.children) {
        _dfs(folders[childId as string]);
      }
    }

    _dfs(folders[folderId]);
  } catch (err) {
    console.log(err);
  }
}

/**
 * Get the parent folder of a given folder
 * @param folderId
 * @returns parentFolder
 */
async function getParentFolder(folderId: string): Promise<Folder | undefined> {
  try {
    let result = await db.find({
      selector: {
        dataType: "folder",
        children: { $in: [folderId] },
      },
    });
    // the parent folder is unique
    return result.docs[0] as Folder;
  } catch (error) {
    console.log(error);
  }
}

/**
 * Move the dragFolder into the dropFolder
 * @param dragFolderId
 * @param dropFolderId
 */
async function moveFolderInto(dragFolderId: string, dropFolderId: string) {
  try {
    // remove from dragFolder's parent folder first
    let dragParentFolder = (await getParentFolder(dragFolderId)) as Folder;
    dragParentFolder.children = dragParentFolder.children.filter(
      (id) => id != dragFolderId
    );
    await updateFolder(dragParentFolder._id, {
      children: dragParentFolder.children,
    } as Folder);

    // add to dropFolder after the dragParentFolder is modified
    let dropFolder: Folder = await db.get(dropFolderId);
    dropFolder.children.push(dragFolderId);
    await updateFolder(dropFolderId, {
      children: dropFolder.children,
    } as Folder);
  } catch (error) {
    console.log(error);
  }
}

export {
  getFolderTree,
  addFolder,
  updateFolder,
  deleteFolder,
  moveFolderInto,
  getParentFolder,
};
