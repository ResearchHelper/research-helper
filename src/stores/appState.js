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
    leftMenuSize: 0,
    rightMenuSize: 0,

    // leftMenu
    leftMenuMode: null,

    // rightMenu
    rightMenuTab: "metaInfoTab",
    rightMenuMode: null, // "infoPane" or "noteEditor"

    // tree view
    selectedFolderId: "",

    // projects
    selectedProjectId: "", // select from tableview
    workingProjectId: "", // select from projectTree
    openedProjectIds: [], //for projectTree

    modifiedProject: null, // data send from metainfo pane to table
    selectedProjectIndex: null, // for faster modification

    // note
    workingNoteId: null,
  }),

  actions: {
    // main layout related
    toggleLeftMenu() {
      this.leftMenuSize = this.leftMenuSize > 0 ? 0 : 20;
    },

    toggleRightMenu(mode) {
      this.rightMenuSize = this.rightMenuSize > 0 ? 0 : 25;
      this.rightMenuMode = this.rightMenuSize > 0 ? mode : null;
    },

    openRightMenu(mode) {
      this.rightMenuSize = 25;
      this.rightMenuMode = mode;
    },

    closeRightMenu() {
      this.rightMenuSize = 0;
      this.rightMenuMode = null;
    },

    setRightMenuMode(mode) {
      // mode can be "infoPane" or "noteEditor"
      this.rightMenuMode = mode;
    },

    setRightMenuTab(tab) {
      this.rightMenuTab = tab;
    },

    setCurrentPage(page) {
      if (page == this.currentPage) this.toggleLeftMenu();
      this.currentPage = page;
    },

    openProject(projectId) {
      this.workingProjectId = projectId;
      if (!this.openedProjectIds.includes(projectId))
        this.openedProjectIds.push(projectId);
    },
  },
});
