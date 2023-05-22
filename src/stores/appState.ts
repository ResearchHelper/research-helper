import { defineStore } from "pinia";
import { AppState, Page, Project, Settings } from "src/backend/database";

export const useStateStore = defineStore("stateStore", {
  state: () => ({
    ready: false,

    // layout
    ribbonToggledBtnUid: "",
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
    openedProjectIds: new Set<string>(), // for projectTree

    // settings
    settings: {
      theme: "dark",
      language: "en_US",
      storagePath: "",
      fontSize: "16px",
    },

    // page
    openedPage: { pageId: "", pageType: "", pageLabel: "" },
    closedPageId: "",
    currentPageId: "library",
  }),

  actions: {
    async loadState(state: AppState) {
      this.leftMenuSize = state.leftMenuSize || this.leftMenuSize;
      this.showLeftMenu = state.showLeftMenu || this.showLeftMenu;
      this.showPDFMenuView = state.showPDFMenuView || this.showPDFMenuView;
      this.pdfRightMenuSize = state.pdfRightMenuSize || this.pdfRightMenuSize;
      this.showPDFRightMenu = state.showPDFRightMenu || this.showPDFRightMenu;
      this.libraryRightMenuSize =
        state.libraryRightMenuSize || this.libraryRightMenuSize;
      this.showLibraryRightMenu =
        state.showLibraryRightMenu || this.showLibraryRightMenu;
      this.ribbonToggledBtnUid =
        state.ribbonToggledBtnUid || this.ribbonToggledBtnUid;
      this.selectedFolderId = state.selectedFolderId || this.selectedFolderId;
      this.currentPageId = state.currentPageId || this.currentPageId;
      this.openedProjectIds = new Set(state.openedProjectIds); // convert to Set after loading
      this.settings = state.settings || this.settings;

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
        pdfRightMenuSize: this.pdfRightMenuSize,
        showPDFRightMenu: this.showPDFRightMenu,
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
      if (!page?.pageId) return;
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
