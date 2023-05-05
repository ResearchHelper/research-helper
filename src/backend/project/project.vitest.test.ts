import { describe, it, expect } from "vitest";
import { db, Meta, Project } from "src/backend/database";
import {
  addProject,
  deleteProject,
  updateProject,
  updateProjectByMeta,
  getProjectsByFolderId,
  getProject,
} from "src/backend/project/project";
import { uid } from "quasar";

describe("project.ts", () => {
  it("addProject", async () => {
    let folderId = uid();
    let project = (await addProject(folderId)) as Project;
    expect(project.dataType).toBe("project");
    expect(project.folderIds).toContain(folderId);
  });

  it("deleteProject from table", async () => {
    let folderId = uid();
    let p = (await addProject(folderId)) as Project;
    await deleteProject(p._id, false, folderId);
    let project = (await getProject(p._id)) as Project;
    expect(project.folderIds).not.toContain(folderId);
  });

  it("deleteProject from db", async () => {
    let folderId = uid();
    let p = (await addProject(folderId)) as Project;
    await deleteProject(p._id, true);

    let results = await db.find({
      selector: {
        _id: p._id,
      },
    });
    expect(results.docs.length).toBe(0);
  });

  it("updateProject", async () => {
    let folderId = uid();
    let p = (await addProject(folderId)) as Project;
    p.title = "test title";
    let project = await updateProject(p);
    expect(project?.title).toBe(p.title);
  });

  it("getProjectsByFolderId", async () => {
    let folderId = uid();
    let n = 10;
    for (let i = 0; i < n; i++) await addProject(folderId);
    let projects = (await getProjectsByFolderId(folderId)) as Project[];
    expect(projects.length).toBe(n);
  });

  it("updateProjectByMeta", async () => {
    let folderId = uid();
    let p = (await addProject(folderId)) as Project;
    let title = "test title";
    let project = (await updateProjectByMeta(p, {
      title: "test title",
    } as Meta)) as Project;
    expect(project.title).toBe(title);
  });
});
