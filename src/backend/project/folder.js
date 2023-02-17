import { db } from "../database";
import { sortTree } from "./utils";

/**
 * Folder data
 * @typedef {Object} Folder
 * @property {string} _id - uid managed by db
 * @property {string} dataType - "folder"
 * @property {string} label - folder name
 * @property {string} icon - folder icon in treeview
 * @property {string[]} children - folderId list
 */

async function getFolderTree() {
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
        label: "Library",
        icon: "home",
        children: [],
        dataType: "folder",
      };
      await db.put(library);
      return [library];
    }

    // create a dict for later use
    let folders = {};
    for (let doc of docs) folders[doc._id] = doc;

    // create tree using depth first search
    function _dfs(root) {
      let children = root.children;
      root.children = [];
      for (let childId of children) {
        root.children.push(_dfs(folders[childId]));
      }
      return root;
    }

    let tree = _dfs(folders["library"]);
    sortTree(tree);

    return [tree];
  } catch (err) {
    console.log(err);
  }
}

async function addFolder(parentId) {
  try {
    // add to database
    let node = {
      label: "New Folder",
      icon: "folder",
      children: [],
      dataType: "folder",
    };
    let result = await db.post(node);
    node = await db.get(result.id);

    // push to children of parent Node
    let parentNode = await db.get(parentId);
    parentNode.children.push(node._id);
    await updateFolder(parentId, { children: parentNode.children });

    return node;
  } catch (err) {
    console.log(err);
  }
}

async function updateFolder(folderId, props) {
  try {
    let folder = await db.get(folderId);
    for (let key in props) {
      folder[key] = props[key];
    }
    await db.put(folder);
    return db.get(folderId);
  } catch (error) {
    console.log(error);
  }
}

async function deleteFolder(folderId) {
  try {
    // delete from children of parent folder
    let result = await db.find({
      selector: { children: { $in: [folderId] } },
    });
    let parentNode = result.docs[0];
    console.log(parentNode);
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
    let folders = {};
    for (let doc of docs) folders[doc._id] = doc;

    function _dfs(root) {
      // console.log("deleting", root._id);
      db.remove(root);
      for (let childId of root.children) {
        _dfs(folders[childId]);
      }
    }

    _dfs(folders[folderId]);
  } catch (err) {
    console.log(err);
  }
}

/**
 * Get the parent folder of a given folder
 * @param {String} folderId
 */
async function getParentFolder(folderId) {
  try {
    let result = await db.find({
      selector: {
        dataType: "folder",
        children: { $in: [folderId] },
      },
    });
    // the parent folder is unique
    return result.docs[0];
  } catch (error) {
    console.log(error);
  }
}

/**
 * Move the dragFolder into the dropFolder
 * @param {String} dragFolderId
 * @param {String} dropFolderId
 */
async function moveFolderInto(dragFolderId, dropFolderId) {
  try {
    // remove from dragFolder's parent folder first
    let dragParentFolder = await getParentFolder(dragFolderId);
    dragParentFolder.children = dragParentFolder.children.filter(
      (id) => id != dragFolderId
    );
    await updateFolder(dragParentFolder._id, {
      children: dragParentFolder.children,
    });

    // add to dropFolder after the dragParentFolder is modified
    let dropFolder = await db.get(dropFolderId);
    dropFolder.children.push(dragFolderId);
    await updateFolder(dropFolderId, { children: dropFolder.children });
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
