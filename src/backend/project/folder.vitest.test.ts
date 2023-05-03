import { describe, it, expect } from "vitest";
import {
  getFolderTree,
  addFolder,
  updateFolder,
  deleteFolder,
  moveFolderInto,
  getParentFolder,
} from "src/backend/project/folder";
import { db, Folder } from "../database";

describe("folder.ts", () => {
  it("getFolderTree", async () => {
    let tree = (await getFolderTree()) as Folder[];
    expect(tree[0]._id).toBe("library");
  });

  it("updateFolder", async () => {
    let parentId = "library";
    let f = (await addFolder(parentId)) as Folder;
    let label = "test label";
    let folder = (await updateFolder(f._id, { label } as Folder)) as Folder;
    expect(folder.label).toBe(label);
  });

  it("deleteFolder", async () => {
    let parentId = "library";
    let folder = (await addFolder(parentId)) as Folder;
    await deleteFolder(folder._id);

    let results = await db.find({
      selector: {
        _id: folder._id,
      },
    });
    expect(results.docs.length).toBe(0);
  });

  it("addFolder", async () => {
    let parentId = "library";
    let folder = (await addFolder(parentId)) as Folder;
    let parentFolder = (await getParentFolder(folder._id)) as Folder;
    expect(parentFolder.children).toContain(folder._id);
  });

  it("moveFolderInto", async () => {
    let folder1 = (await addFolder("library")) as Folder;
    let folder2 = (await addFolder("library")) as Folder;
    await moveFolderInto(folder1._id, folder2._id);
    let parentFolder = (await getParentFolder(folder1._id)) as Folder;
    expect(parentFolder.children).toContain(folder1._id);
  });
});
