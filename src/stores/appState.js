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

    // tree view
    selectedFolderId: "",

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
  },
});
