import { defineStore } from "pinia";
import { AppState, Project, Settings } from "src/backend/database";

export const useStateStore = defineStore("stateStore", {
  state: () => ({
    ready: false,

    // layout
    leftMenuSize: 20,
    showLeftMenu: false,
    visibility: new Map<string, boolean>(),

    // tree view
    selectedFolderId: "library",

    // projects
    selectedItemId: "", // select from tableview
    workingItemId: "library", // workingItem
    openedProjectIds: new Set<string>(), // for projectTree
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
    async loadState(state: AppState) {
      this.leftMenuSize = state.leftMenuSize || this.leftMenuSize;
      this.showLeftMenu = state.showLeftMenu || this.showLeftMenu;
      this.selectedFolderId = state.selectedFolderId || this.selectedFolderId;
      this.workingItemId = state.workingItemId || this.workingItemId;
      this.openedProjectIds = new Set(state.openedProjectIds); // convert to Set after loading
      this.settings = state.settings || this.settings;

      this.ready = true;
    },

    saveState(): AppState {
      return {
        _id: "appState",
        dataType: "appState",
        leftMenuSize: this.leftMenuSize,
        showLeftMenu: this.showLeftMenu,
        selectedFolderId: this.selectedFolderId,
        workingItemId: this.workingItemId,
        openedProjectIds: [...this.openedProjectIds] as string[], // convert to Array for saving
        settings: this.settings as Settings,
      } as AppState;
    },

    openItem(itemId: string) {
      this.openItemId = itemId;
      // set this to empty, so that user can reopen the same project
      setTimeout(() => {
        this.openItemId = "";
      }, 100);
    },

    updateOpenedProject(project: Project) {
      // Do we need this?
    },
  },
});
