import { defineStore } from "pinia";

const path = window.path;
const fs = window.fs;

export const useStateStore = defineStore("stateStore", {
  state: () => ({
    ready: false,

    // user data path
    storagePath:
      "/home/huntfeng/projects/research-helper-quasar/backend/storage",

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
      if (!this.openedProjectIds.includes(projectId))
        this.openedProjectIds.push(projectId);
    },

    async loadState(state) {
      this.storagePath = state.storagePath;
      this.leftMenuSize = state.leftMenuSize;
      this.showLeftMenu = state.showLeftMenu;
      this.selectedFolderId = state.selectedFolderId;
      this.workingItemId = state.workingItemId;
      this.openedProjectIds = state.openedProjectIds;

      this.ready = true;
    },

    saveState() {
      let state = {
        _id: "app_state",
        storagePath: this.storagePath,
        leftMenuSize: this.leftMenuSize,
        showLeftMenu: this.showLeftMenu,
        selectedFolderId: this.selectedFolderId,
        workingItemId: this.workingItemId,
        openedProjectIds: this.openedProjectIds,
      };
      return state;
    },
  },
});
