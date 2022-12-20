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

    // tree view
    selectedFolderId: "",

    // projects
    selectedProjectId: "", // select from tableview

    modifiedProject: null, // data send from metainfo pane to table
    selectedProjectIndex: null, // for faster modification

    workingItemId: "library", // workingItem
    openedProjectIds: [], // for projectTree
  }),

  actions: {
    // main layout related
    toggleLeftMenu() {
      this.leftMenuSize = this.leftMenuSize > 0 ? 0 : 20;
    },

    setRightMenuTab(tab) {
      this.rightMenuTab = tab;
    },

    setCurrentPage(page) {
      if (page == this.currentPage) this.toggleLeftMenu();
      this.currentPage = page;
    },

    openProject(projectId) {
      this.workingItemId = projectId;
      if (!this.openedProjectIds.includes(projectId))
        this.openedProjectIds.push(projectId);
    },
  },
});
