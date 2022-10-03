import { v4 as uuidv4 } from "uuid";
import { defineStore } from "pinia";

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

    // pdf states
    pdfStates: {},
  }),

  actions: {
    toggleLeftMenu() {
      this.leftMenuSize = this.leftMenuSize > 0 ? 0 : 20;
    },

    toggleInfoPane() {
      this.infoPaneSize = this.infoPaneSize > 0 ? 0 : 25;
    },

    setPDFState(state) {
      let id = this.workingProject.projectId;
      if (!(id in this.pdfStates)) this.pdfStates[id] = {};

      for (let k in state) {
        this.pdfStates[id][k] = state[k];
      }
    },

    savePDFStates() {
      console.log("save:", this.pdfStates);
    },
  },
});
