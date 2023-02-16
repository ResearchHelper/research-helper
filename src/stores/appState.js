import { defineStore } from "pinia";
import { useQuasar } from "quasar";

export const useStateStore = defineStore("stateStore", {
  state: () => ({
    ready: false,

    // layout
    leftMenuSize: 20,
    showLeftMenu: false,

    // tree view
    selectedFolderId: "library",

    // projects
    selectedItemId: "", // select from tableview
    workingItemId: "library", // workingItem
    openedProjectIds: new Set(), // for projectTree
    openItemId: "", // communicate between layout and deep vue component

    // settings
    settings: {
      theme: "dark",
      language: "en_US",
      storagePath: "",
      fontSize: "16px",
    },
  }),

  actions: {
    async loadState(state) {
      this.leftMenuSize = state.leftMenuSize || this.leftMenuSize;
      this.showLeftMenu = state.showLeftMenu || this.showLeftMenu;
      this.selectedFolderId = state.selectedFolderId || this.selectedFolderId;
      this.workingItemId = state.workingItemId || this.workingItemId;
      this.openedProjectIds = new Set(state.openedProjectIds); // convert to Set after loading
      this.settings = state.settings || this.settings;

      this.ready = true;
    },

    saveState() {
      let state = {
        _id: "appState",
        dataType: "appState",
        leftMenuSize: this.leftMenuSize,
        showLeftMenu: this.showLeftMenu,
        selectedFolderId: this.selectedFolderId,
        workingItemId: this.workingItemId,
        openedProjectIds: [...this.openedProjectIds], // convert to Array for saving
        settings: this.settings,
      };
      return state;
    },
  },
});
