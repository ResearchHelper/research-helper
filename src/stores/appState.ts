import { defineStore } from "pinia";
import { AppState, Page, Settings } from "src/backend/database";

export const useStateStore = defineStore("stateStore", {
  state: () => ({
    ready: false,

    // layout
    ribbonToggledBtnUid: "",
    leftMenuSize: 20,
    showLeftMenu: false,
    showPDFMenuView: false,
    libraryRightMenuSize: 30,
    showLibraryRightMenu: false,

    // tree view
    selectedFolderId: "library",

    // projects
    openedProjectIds: new Set<string>(), // for projectTree

    // settings
    settings: {
      theme: "dark",
      language: "en_US",
      storagePath: "",
      fontSize: "16px",
      citeKeyRule: "author_title_year",
    } as Settings,

    // page
    openedPage: { id: "", type: "", label: "" },
    closedPageId: "",
    currentPageId: "library",
  }),

  actions: {
    async loadState(state: AppState) {
      this.leftMenuSize = state.leftMenuSize || this.leftMenuSize;
      this.showLeftMenu = state.showLeftMenu || this.showLeftMenu;
      this.showPDFMenuView = state.showPDFMenuView || this.showPDFMenuView;
      this.libraryRightMenuSize =
        state.libraryRightMenuSize || this.libraryRightMenuSize;
      this.showLibraryRightMenu =
        state.showLibraryRightMenu || this.showLibraryRightMenu;
      this.ribbonToggledBtnUid =
        state.ribbonToggledBtnUid || this.ribbonToggledBtnUid;
      this.selectedFolderId = state.selectedFolderId || this.selectedFolderId;
      this.currentPageId = state.currentPageId || this.currentPageId;
      this.openedProjectIds = new Set(state.openedProjectIds); // convert to Set after loading
      this.settings = Object.assign(this.settings, state.settings); // if state.settings is missing anything, this won't hurt!

      this.ready = true;
    },

    saveState(): AppState {
      return {
        _id: "appState",
        dataType: "appState",
        ribbonToggledBtnUid: this.ribbonToggledBtnUid,
        leftMenuSize: this.leftMenuSize,
        showLeftMenu: this.showLeftMenu,
        showPDFMenuView: this.showPDFMenuView,
        libraryRightMenuSize: this.libraryRightMenuSize,
        showLibraryRightMenu: this.showLibraryRightMenu,
        selectedFolderId: this.selectedFolderId,
        currentPageId: this.currentPageId,
        openedProjectIds: [...this.openedProjectIds] as string[], // convert to Array for saving
        settings: this.settings as Settings,
      } as AppState;
    },

    /**
     * Layout Control
     */

    openPage(page: Page | null) {
      if (!page?.id) return;
      this.openedPage = page;
    },

    closePage(pageId: string) {
      if (!pageId) return;
      this.closedPageId = pageId;
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
