import { v4 as uuidv4 } from "uuid";
import { defineStore } from "pinia";

const path = window.path;
const fs = window.fs;

export const useStateStore = defineStore("stateStore", {
  state: () => ({
    // user data path
    storagePath:
      "/home/huntfeng/projects/research-helper-quasar/backend/storage",

    // page
    currentPage: "library",

    // layout
    leftMenuSize: 20,
    infoPaneSize: 0,

    // actionbar
    addedFiles: [],
    searchString: "",

    // tree view
    selectedTreeNode: null,

    // table view
    selectedProject: null,
    openedProjects: [],
    workingProject: null, // this is in the openedProjects list

    // info pane
    infoPaneTab: "metaInfoTab",

    // note
    workingNote: null,
  }),

  actions: {
    // main layout related
    toggleLeftMenu() {
      this.leftMenuSize = this.leftMenuSize > 0 ? 0 : 20;
    },

    toggleInfoPane() {
      this.infoPaneSize = this.infoPaneSize > 0 ? 0 : 25;
    },

    setInfoPaneTab(tab) {
      this.infoPaneTab = tab;
    },

    setCurrentPage(page) {
      if (page == this.currentPage) this.toggleLeftMenu();
      this.currentPage = page;
    },

    // pdf left menu related
    closeProject(projectId) {
      // remove from opened projects
      this.openedProjects = this.openedProjects.filter(
        (project) => project.projectId != projectId
      );

      if (this.openedProjects.length == 0) {
        this.setCurrentPage("library");
      } else {
        // if this is workingProject, change it to something else
        if (projectId == this.workingProject.projectId) {
          this.workingProject = this.openedProjects[0];
        }
      }
    },
  },
});
