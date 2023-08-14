import { describe, it, expect } from "vitest";
import { db, Meta, Project } from "src/backend/database";
import {
  createProject,
  addProject,
  deleteProject,
  updateProject,
  getProject,
  getProjects,
} from "src/backend/project/project";
import { uid } from "quasar";

describe("project.ts", () => {
  it("createProject", async () => {
    let folderId = uid();
    let project = createProject(folderId);
    expect(project.dataType).toBe("project");
    expect(project.folderIds).toContain(folderId);
  });

  it("deleteProject from table", async () => {
    let folderId = uid();
    let project = createProject(folderId);
    project = (await addProject(project)) as Project;
    await deleteProject(project._id, false, folderId);
    project = (await getProject(project._id)) as Project;
    expect(project.folderIds).not.toContain(folderId);
  });

  it("deleteProject from db", async () => {
    let folderId = uid();
    let project = createProject(folderId);
    project = (await addProject(project)) as Project;
    await deleteProject(project._id, true);

    let p = await getProject(project._id);
    expect(p).toBe(undefined);
  });

  it("updateProject", async () => {
    let folderId = uid();
    let project = createProject(folderId);
    project = (await addProject(project)) as Project;
    project.title = "test title";
    let p = (await updateProject(project._id, project)) as Project;
    expect(p.title).toBe(project.title);
  });

  it("getProjectsByFolderId", async () => {
    let folderId = uid();
    let n = 10;
    for (let i = 0; i < n; i++) {
      let project = createProject(folderId);
      await addProject(project);
    }
    let projects = (await getProjects(folderId)) as Project[];
    expect(projects.length).toBe(n);
  });
});
