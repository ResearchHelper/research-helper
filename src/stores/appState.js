import { defineStore } from "pinia";

const path = window.path;
const fs = window.fs;

export const useStateStore = defineStore("stateStore", {
  state: () => ({
    ready: false,

    // user data path
    storagePath: "",

    // layout
    leftMenuSize: 20,
    showLeftMenu: false,

    // tree view
    selectedFolderId: "library",

    // projects
    // selectedProjectId: "", // select from tableview
    selectedItemId: "",
    workingItemId: "library", // workingItem
    openedProjectIds: new Set(), // for projectTree
    openItemId: "", // communicate between layout and deep vue component
  }),

  actions: {
    async loadState(state) {
      this.storagePath = state.storagePath;
      this.leftMenuSize = state.leftMenuSize;
      this.showLeftMenu = state.showLeftMenu;
      this.selectedFolderId = state.selectedFolderId;
      this.workingItemId = state.workingItemId;
      this.openedProjectIds = new Set(state.openedProjectIds); // convert to Set after loading

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
        openedProjectIds: [...this.openedProjectIds], // convert to Array for saving
      };
      return state;
    },
  },
});
