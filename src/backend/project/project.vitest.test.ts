import { describe, it, expect } from "vitest";
import { Project } from "src/backend/database";
import {
  addProject,
  deleteProject,
  updateProject,
  updateProjectByMeta,
  getProjectsByFolderId,
  getProject,
  getAllProjects,
} from "src/backend/project/project";

describe("project.ts", () => {
  it("addProject", async () => {
    let project = (await addProject("testId")) as Project;
    expect(project.dataType).toBe("project");
    expect(project.folderIds).toContain("testId");
  });
});
