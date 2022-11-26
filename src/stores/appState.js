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
    folders: [],
    selectedTreeNode: null,
    selectedProject: null,

    // table view
    openedProjects: [],
    workingProject: null, // this is in the openedProjects list

    // info pane
    infoPaneTab: "metaInfoTab",

    // note
    workingNote: null,

    // pdf states
    pdfStates: {},
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

    // pdf realated functionalities
    loadPDFState() {
      // load pdfState from disk
      let projectId = this.workingProject.projectId;
      let dirPath = path.join(this.storagePath, "projects", projectId);
      let pdfStatePath = path.join(dirPath, "pdfstate.json");
      let state = null;
      if (fs.existsSync(pdfStatePath)) {
        state = JSON.parse(fs.readFileSync(pdfStatePath, "utf8"));
      } else {
        state = {
          pagesCount: 1,
          currentPageNumber: 1,
          currentScale: 1,
          currentScaleValue: "",
          spreadMode: 0,
          tool: "cursor",
          color: "#FFFF00",
          search: {
            query: "",
            highlightAll: true,
            caseSensitive: false,
            entireWord: false,
          },
        };
      }
      this.pdfStates[projectId] = state;
    },

    savePDFStates() {
      // write pdfStates to disk
      for (let projectId in this.pdfStates) {
        let dirPath = path.join(this.storagePath, "projects", projectId);
        let pdfStatePath = path.join(dirPath, "pdfstate.json");
        fs.writeFileSync(
          pdfStatePath,
          JSON.stringify(this.pdfStates[projectId])
        );
      }
    },

    getPDFState() {
      // accessing the current pdfState from components
      let projectId = this.workingProject.projectId;
      if (!(projectId in this.pdfStates)) {
        this.pdfStates[projectId] = {
          pagesCount: 1,
          currentPageNumber: 1,
          currentScale: 1,
          currentScaleValue: "",
          spreadMode: 0,
          tool: "cursor",
          color: "#FFFF00",
        };
      }
      return this.pdfStates[projectId];
    },

    setPDFState(params) {
      // setting pdfStates from components
      // params is a dict
      let projectId = this.workingProject.projectId;
      for (let k in params) {
        this.pdfStates[projectId][k] = params[k];
      }
    },
  },
});
