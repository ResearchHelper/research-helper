function deleteFolder(folderId) {
  let docs = [
    { _id: "library", children: ["1", "2"] },
    { _id: "1", children: ["1.1", "1.2"] },
    { _id: "2", children: ["2.1"] },
    { _id: "1.1", children: [] },
    { _id: "1.2", children: [] },
    { _id: "2.1", children: ["2.1.1"] },
    { _id: "2.1.1", children: [] },
  ];

  // create a dict for later use
  let folders = {};
  for (let doc of docs) folders[doc._id] = doc;

  // delete subfolders using dfs
  function _dfs(root) {
    console.log("deleting", root._id);
    for (let childId of root.children) {
      _dfs(folders[childId]);
    }
  }

  _dfs(folders[folderId]);
}

// getFolderTree();
// deleteFolder("2");
