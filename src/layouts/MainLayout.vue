<template>
  <WelcomeCarousel
    v-if="welcomeCarousel"
    @selectPath="(path) => changeStoragePath(path)"
  />
  <q-splitter
    :model-value="56"
    unit="px"
    :separator-style="{ cursor: 'default' }"
  >
    <template v-slot:before>
      <div
        style="height: 100vh; background: var(--color-leftmenu-bkgd)"
        class="column justify-between"
      >
        <div>
          <q-btn-toggle
            v-model="leftMenu"
            unelevated
            square
            :ripple="false"
            clearable
            :options="[{ icon: 'account_tree', value: true }]"
            @update:model-value="stateStore.saveState()"
          >
            <q-tooltip>{{ $t("openedProjects") }}</q-tooltip>
          </q-btn-toggle>
        </div>

        <div>
          <q-btn
            flat
            square
            icon="home"
            :ripple="false"
            @click="setComponent('library')"
          >
            <q-tooltip>{{ $t("library") }}</q-tooltip>
          </q-btn>
          <q-btn
            flat
            square
            :ripple="false"
            icon="help"
            @click="setComponent('help')"
          >
            <q-tooltip>{{ $t("help") }}</q-tooltip>
          </q-btn>
          <q-btn
            flat
            square
            :ripple="false"
            icon="settings"
            @click="setComponent('settings')"
          >
            <q-badge
              v-if="isUpdateAvailable"
              floating
              rounded
              color="blue"
              style="top: 10%; right: 10%"
            ></q-badge>
            <q-tooltip>{{ $t("settings") }}</q-tooltip>
          </q-btn>
        </div>
      </div>
    </template>
    <template v-slot:after>
      <q-splitter
        :limits="[0, 60]"
        emit-immediately
        separator-class="q-splitter-separator"
        v-model="leftMenuSize"
        @update:model-value="(size) => resizeLeftMenu(size)"
      >
        <template v-slot:before>
          <ProjectTree
            style="height: 100vh"
            v-if="stateStore.ready"
            @addNode="(element) => addDragSource(element)"
            @renameNode="(node) => editComponentState(node)"
            @openProject="(projectId) => (stateStore.openItemId = projectId)"
            @closeProject="(projectId) => removeComponent(projectId)"
            ref="tree"
          />
        </template>
        <template v-slot:after>
          <GLayout
            v-if="stateStore.ready"
            ref="layout"
            style="width: 100%; height: 100vh"
            v-model:workingItemId="stateStore.workingItemId"
            @layoutchanged="onLayoutChanged"
            @itemdestroyed="onItemDestroyed"
          ></GLayout>
        </template>
      </q-splitter>
    </template>
  </q-splitter>
</template>

<script>
import ProjectTree from "src/components/ProjectTree.vue";
import WelcomeCarousel from "src/components/WelcomeCarousel.vue";
import GLayout from "./GLayout.vue";
import "src/css/goldenlayout/base.scss";
import "src/css/goldenlayout/theme.scss";

import { useQuasar } from "quasar";
import { useStateStore } from "src/stores/appState";
import { getProject } from "src/backend/project/project";
import { getNotes } from "src/backend/project/note";
import {
  getLayout,
  updateLayout,
  getAppState,
  updateAppState,
} from "src/backend/appState";

export default {
  components: {
    GLayout,
    ProjectTree,
    WelcomeCarousel,
  },

  setup() {
    const $q = useQuasar();
    const stateStore = useStateStore();
    return { stateStore };
  },

  data() {
    return {
      welcomeCarousel: false,

      leftMenuSize: 0,

      dragover: false,

      isUpdateAvailable: false,
    };
  },

  computed: {
    leftMenu: {
      get() {
        return this.leftMenuSize > 0;
      },

      set(visible) {
        this.stateStore.showLeftMenu = visible;
        if (visible) {
          // if visible, the left menu has at least 10 unit width
          this.leftMenuSize = Math.max(this.stateStore.leftMenuSize, 15);
        } else {
          // if not visible, record the size and close the menu
          this.stateStore.leftMenuSize = this.leftMenuSize;
          this.leftMenuSize = 0;
        }
        this.$nextTick(() => {
          this.$refs.layout.resize();
          this.saveLayout();
          this.saveAppState();
        });
      },
    },
  },

  watch: {
    async "stateStore.openItemId"(id) {
      if (!!!id) return;
      let item = await getProject(id);
      if (item?.dataType === "project" && !item?.path) {
        // although no window will be open, but still set ti as workingItem
        this.stateStore.workingItemId = id;
        return;
      }
      this.setComponent(id).then(() => {
        this.stateStore.openItemId = null;
      });
    },

    "stateStore.openedProjectIds": {
      handler(projectIds) {
        this.saveAppState();
      },
      deep: true,
    },
  },

  async mounted() {
    let state = await getAppState();
    this.stateStore.loadState(state);

    if (this.stateStore.showLeftMenu) this.leftMenuSize = state.leftMenuSize;
    const layout = await getLayout();
    await this.$refs.layout.loadGLLayout(layout.config);

    window.updater.updateAvailable((isAvailable) => {
      this.isUpdateAvailable = isAvailable;
    });
    this.changeTheme(this.stateStore.settings.theme);
    this.changeLanguage(this.stateStore.settings.language);
    this.changeFontSize(this.stateStore.settings.fontSize);
    if (!this.stateStore.settings.storagePath) {
      this.welcomeCarousel = true;
    }
    await this.saveAppState();
  },

  methods: {
    /**
     * Load and apply settings
     */

    changeTheme(theme) {
      switch (theme) {
        case "dark":
          this.$q.dark.set(true);
          break;

        case "light":
          this.$q.dark.set(false);
          break;
      }
    },

    changeLanguage(locale) {
      this.$i18n.locale = locale;
    },

    changeFontSize(fontSize) {
      document.documentElement.style.fontSize = fontSize;
    },

    changeStoragePath(path) {
      // update db
      this.stateStore.settings.storagePath = path;
      this.saveAppState();

      // update ui
      this.welcomeCarousel = false;
    },

    /*****************************************************************
     * GoldenLayout (set, rename, remove component)
     *****************************************************************/

    /**
     * Set focus to component with specified id
     * create it if it doesn't exist
     * @param {String} id
     */
    async setComponent(id) {
      let componentType = "";
      let title = "";
      switch (id) {
        case "library":
          componentType = "LibraryPage";
          title = this.$t("library");
          break;
        case "help":
          componentType = "HelpPage";
          title = this.$t("help");
          break;
        case "settings":
          componentType = "SettingsPage";
          title = this.$t("settings");
          break;
        default:
          let item = await getProject(id);
          if (item.dataType == "project") {
            componentType = "ReaderPage";
            title = item.title;
          } else if (item.dataType == "note") {
            componentType = "NotePage";
            title = item.label;
          }
          break;
      }

      await this.$refs.layout.addGLComponent(componentType, title, id);
      await this.saveLayout();
      await this.saveAppState();
    },

    /**
     * Closing the project need to close the related windows
     * @param {string} id
     */
    async removeComponent(id) {
      this.$refs.layout.removeGLComponent(id);
      let item = await getProject(id);
      // item might be undefined, use ?.
      if (item?.dataType === "project") {
        let notes = await getNotes(id);
        for (let note of notes) {
          this.$refs.layout.removeGLComponent(note._id);
        }
      }
    },

    /**
     * After renaming a row in projectTree, we need to rename the window title.
     * And we need to add dragsource again
     * @param {HTMLElement} element
     */
    async editComponentState(element) {
      let id = element.getAttribute("item-id");
      let title = element.innerText;
      this.$refs.layout.renameGLComponent(id, title);
      this.addDragSource(element);
    },

    /***************************************************
     * Layout and AppState
     ***************************************************/

    async resizeLeftMenu(size) {
      this.$refs.layout.resize();
      this.stateStore.leftMenuSize = size > 10 ? size : 10;
    },

    /**
     * When layout is changed, save layout and appstate
     */
    async onLayoutChanged() {
      await this.$nextTick();

      // if the last window is closed, open library page
      // this is to prevent the undefined root problem
      let config = this.$refs.layout.getLayoutConfig();
      if (config.root === undefined) {
        this.setComponent("library");
        await this.$nextTick();
      }

      // save layouts and appstate
      await this.saveLayout();
      await this.saveAppState();
    },

    async saveLayout() {
      if (!this.$refs.layout.initialized) return;
      let config = this.$refs.layout.getLayoutConfig();
      await updateLayout(config);
    },

    async saveAppState() {
      if (!this.stateStore.ready) return;
      // if folders are not created yet
      // selectedFolderId is ""
      if (!!!this.stateStore.selectedFolderId) {
        this.stateStore.selectedFolderId = "library";
      }
      let state = this.stateStore.saveState();
      await updateAppState(state);
    },

    /*******************************************
     * Drag and drop to GLayout to add component
     *******************************************/

    /**
     * FIXME
     * Add dragSource to the rows in projectTree
     * @param {HTMLElement} element
     * @param {boolean} addComponentOnly
     */
    addDragSource(element, addComponentOnly = false) {
      // FIXME multi-windows with same id is not well supported
      // think about a good way to do this
      // can we view the same "Object" in different windows ?
      // so that we don't need to worry about update conflict
      element.style.userSelect = "none";
      return;

      if (!!!element) return;

      let type = element.getAttribute("type");
      let id = element.getAttribute("item-id");
      let componentType = type == "project" ? "ReaderPage" : "NotePage";
      this.$refs.layout.addGLDragSource(
        element,
        componentType,
        { id: id },
        element.innerText,
        addComponentOnly
      );
    },

    /**
     * After a window is closed (but the project is not closed yet,
     * we need to add a void component so we can drag that project to open window again
     * @param {string} id
     */
    onItemDestroyed(id) {
      setTimeout(() => {
        let treeEl = this.$refs.tree.$el;
        let element = treeEl.querySelector(`[item-id='${id}']`);
        this.addDragSource(element, true);
      }, 100);
    },
  },
};
</script>
