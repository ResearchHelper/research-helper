import { db } from "../database";

async function getFolderTree() {
  try {
    let result = await db.find({
      selector: {
        datatype: "folder",
      },
    });
    let docs = result.docs;

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

    return [_dfs(folders["library"])];
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
      datatype: "folder",
    };
    let result = await db.post(node);
    node = await db.get(result.id);

    // push to children of parent Node
    let parentNode = await db.get(parentId);
    parentNode.children.push(node._id);
    await updateFolder(parentNode);

    return node;
  } catch (err) {
    console.log(err);
  }
}

function updateFolder(node) {
  return db.put(node);
}

async function deleteFolder(folderId) {
  try {
    await db.createIndex({
      index: {
        fields: ["children"],
      },
    });

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
        datatype: "folder",
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

export { getFolderTree, addFolder, updateFolder, deleteFolder };
