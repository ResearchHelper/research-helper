import { defineStore } from "pinia";
import {
  addProject,
  deleteProject,
  updateProject,
  getProject,
  getProjectsByFolderId,
} from "src/api/project/project";

export const useProjectStore = defineStore("projectStore", {
  state: () => ({
    projects: [], // the dataset for table and infotab
    selectedProject: null,
    openedProjects: [],
    workingProject: null, // this is in the openedProjects List
    workingNote: null,

    searchString: "", // used to filter projects
  }),

  actions: {
    setWorkingProject(project) {
      this.workingProject = {
        _id: project._id,
        path: project.path,
      };
      this.workingNote = null;

      for (let p of this.openedProjects) {
        if (p._id == project._id) return;
      }
      this.openedProjects.push(project);
    },

    async getProjects(folderId) {
      this.projects = await getProjectsByFolderId(folderId);
    },

    async get(projectId) {
      return await getProject(projectId);
    },

    async add(file) {
      // update db
      let project = await addProject(file);

      // update ui by push to projects
      this.projects.push(project);
    },

    async delete(deleteFromDB) {
      // update db
      let project = await getProject(this.selectedProject._id);
      await deleteProject(project, deleteFromDB);

      // update ui
      this.projects = this.projects.filter((p) => p._id != project._id);
    },

    async update(projectId, data) {
      // update db
      let project = await getProject(projectId);
      for (let prop in data) {
        project[prop] = data[prop];
      }
      await updateProject(project);

      // update ui
      project = await getProject(projectId);
      for (let i in this.projects) {
        if (this.projects[i]._id == project._id) {
          this.projects[i] = project;
        }
      }
    },

    async getRelatedProjects(projectIds) {
      let projects = [];
      for (let projectId of projectIds) {
        projects.push(await getProject(projectId));
      }
      return projects;
    },
  },
});
