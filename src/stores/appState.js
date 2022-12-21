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
    showLeftMenu: false,

    // tree view
    selectedFolderId: "",

    // projects
    selectedProjectId: "", // select from tableview
    workingItemId: "library", // workingItem
    openedProjectIds: [], // for projectTree
    openItemId: "", // communicate between layout and deep vue component
  }),

  actions: {
    openProject(projectId) {
      // this.workingItemId = projectId;
      if (!this.openedProjectIds.includes(projectId))
        this.openedProjectIds.push(projectId);
    },
  },
});
