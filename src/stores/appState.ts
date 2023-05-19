import { defineStore } from "pinia";
import { AppState, Project, Settings } from "src/backend/database";

export const useStateStore = defineStore("stateStore", {
  state: () => ({
    ready: false,

    // layout
    ribbonToggledBtnId: "",
    leftMenuSize: 20,
    showLeftMenu: false,
    showPDFMenuView: false,
    pdfRightMenuSize: 30,
    showPDFRightMenu: false,
    libraryRightMenuSize: 30,
    showLibraryRightMenu: false,

    // tree view
    selectedFolderId: "library",

    // projects
    selectedItemId: "", // select from tableview
    workingItemId: "library", // workingItem
    openedProjectIds: new Set<string>(), // for projectTree
    openItemId: "", // communicate between layout and deep component
    closeItemId: "", // communicate between layout and deep component

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

    /**
     * Layout Control
     */

    /**
     * Open a page
     * @param itemId
     */
    openItem(itemId: string) {
      this.openItemId = itemId;
      // set this to empty, so that user can reopen the same item as 1 second
      setTimeout(() => {
        this.openItemId = "";
      }, 1000);
    },

    /**
     * Close a page
     * @param itemId
     */
    closeItem(itemId: string) {
      this.closeItemId = itemId;
    },

    /**
     * Toggle left menu
     * If visible is given, set the state as it is
     * @param visible
     */
    toggleLeftMenu(visible?: boolean) {
      if (visible === undefined) {
        this.showLeftMenu = !this.showLeftMenu;
      } else {
        this.showLeftMenu = visible;
      }
    },

    /**
     * Toggle PDF right menu
     * If visible is given, set the state as it is
     * @param visible
     */
    togglePDFRightMenu(visible?: boolean) {
      if (visible === undefined) {
        this.showPDFRightMenu = !this.showPDFRightMenu;
      } else {
        this.showPDFRightMenu = visible;
      }
    },

    /**
     * Toggle pdf floating menu
     * If visible is given, set the state as it is
     * @param visible
     */
    togglePDFMenuView(visible?: boolean) {
      if (visible === undefined) {
        this.showPDFMenuView = !this.showPDFMenuView;
      } else {
        this.showPDFMenuView = visible;
      }
    },
  },
});
