import { defineStore } from "pinia";
import { Dark } from "quasar";
import { updateAppState } from "src/backend/appState";
import { AppState, Page, Settings } from "src/backend/database";
import { useProjectStore } from "./projectStore";
import darkContent from "src/css/vditor/dark.css?raw";
import lightContent from "src/css/vditor/light.css?raw";

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

    async openPage(page: Page | null) {
      if (!page?.id) return;
      const projectStore = useProjectStore();
      if (page.type === "ReaderPage") await projectStore.openProject(page.id);
      else if (page.type === "NotePage" || page.type === "ExcalidrawPage") {
        let note = await projectStore.getNoteFromDB(page.id);
        if (note && note.projectId)
          await projectStore.openProject(note.projectId);
      }
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

    changeTheme(theme: string) {
      // ui
      switch (theme) {
        case "dark":
          Dark.set(true);
          break;
        case "light":
          Dark.set(false);
          break;
      }

      // set the vditor style so all vditors in the app can share this
      // must append editorStyle before contentStyle
      // otherwise the texts are dark
      let contentStyle = document.getElementById(
        "vditor-content-style"
      ) as HTMLStyleElement;
      if (contentStyle === null) {
        contentStyle = document.createElement("style") as HTMLStyleElement;
        contentStyle.id = "vditor-content-style";
        contentStyle.type = "text/css";
        document.head.append(contentStyle);
      }
      switch (theme) {
        case "dark":
          contentStyle.innerHTML = darkContent;
          break;
        case "light":
          contentStyle.innerHTML = lightContent;
          break;
      }

      // db
      this.settings.theme = theme;
      this.saveAppState();
    },

    changeFontSize(size: number) {
      // ui
      document.documentElement.style.fontSize = `${size}px`;

      // db
      this.settings.fontSize = `${size}px`;
      this.saveAppState();
    },

    changeLanguage(language: string) {
      // the vue-i18n can only be used in vue, not pinia

      // db
      this.settings.language = language;
      this.saveAppState();
    },

    async saveAppState() {
      const projectStore = useProjectStore();
      let state = this.saveState();
      state.openedProjectIds = projectStore.openedProjects.map(
        (project) => project._id
      );
      await updateAppState(state);
    },
  },
});
