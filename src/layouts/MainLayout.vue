<template>
  <WelcomeCarousel v-model="showWelcomeCarousel" />

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
            v-model="isLeftMenuVisible"
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
            v-if="showTestBtn"
            flat
            square
            label="Test"
            @click="stateStore.openItem('testNote')"
          >
            <q-tooltip>Test Page</q-tooltip>
          </q-btn>
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
          <LeftMenu
            v-if="ready"
            style="height: 100vh"
            @renameNode="(node) => editComponentState(node)"
            ref="leftMenu"
          />
        </template>
        <template v-slot:after>
          <GLayout
            style="width: 100%; height: 100vh"
            v-model:workingItemId="stateStore.workingItemId"
            @layoutchanged="onLayoutChanged"
            ref="layout"
          ></GLayout>
        </template>
      </q-splitter>
    </template>
  </q-splitter>
</template>

<script setup lang="ts">
// types
import { Project, Note, BusEvent } from "src/backend/database";
// components
// import ProjectTree from "src/components/leftmenu/ProjectTree.vue";
import LeftMenu from "src/components/leftmenu/LeftMenu.vue";
import WelcomeCarousel from "src/components/WelcomeCarousel.vue";
// GoldenLayout
import GLayout from "./GLayout.vue";
import "src/css/goldenlayout/base.scss";
import "src/css/goldenlayout/theme.scss";
// db
import { useStateStore } from "src/stores/appState";
import { getProject } from "src/backend/project/project";
import { getNotes } from "src/backend/project/note";
import {
  getLayout,
  updateLayout,
  getAppState,
  updateAppState,
} from "src/backend/appState";
// utils
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { useQuasar } from "quasar";
import { useI18n } from "vue-i18n";
import { EventBus } from "quasar";

const stateStore = useStateStore();
const $q = useQuasar();
const { locale, t } = useI18n({ useScope: "global" });
const bus = inject("bus") as EventBus;

/*************************************************
 * Component refs, data, computed values
 *************************************************/
const layout = ref<InstanceType<typeof GLayout> | null>(null);
const leftMenu = ref<InstanceType<typeof LeftMenu> | null>(null);

const showTestBtn = process.env.DEV || process.env.DEBUGGING; // show testPage btn if in dev
const showWelcomeCarousel = ref(false);
const leftMenuSize = ref(0);
const isUpdateAvailable = ref(false);
const ready = ref(false);

const isLeftMenuVisible = computed({
  get() {
    return leftMenuSize.value > 0;
  },
  set(visible: boolean) {
    stateStore.showLeftMenu = visible;
    if (visible) {
      // if visible, the left menu has at least 10 unit width
      leftMenuSize.value = Math.max(stateStore.leftMenuSize, 15);
    } else {
      // if not visible, record the size and close the menu
      stateStore.leftMenuSize = leftMenuSize.value;
      leftMenuSize.value = 0;
    }
    nextTick(() => {
      if (layout.value) layout.value.resize();
      saveLayout();
      saveAppState();
    });
  },
});

/*******************
 * Watchers
 *******************/
watch(
  () => stateStore.openItemId,
  async (id: string) => {
    if (!!!id) return;
    let item = await getProject(id);
    if (item?.dataType === "project" && !item?.path) {
      // although no window will be open, but still set ti as workingItem
      stateStore.workingItemId = id;
      return;
    }
    await setComponent(id);
  }
);

watch(
  () => stateStore.closeItemId,
  async (id: string) => {
    if (!!!id) return;
    await removeComponent(id);
  }
);

// must convert Set to Array first
watch(
  () => [...stateStore.openedProjectIds],
  () => {
    saveAppState();
  }
);

/*******************************************************
 * Methods
 *******************************************************/

/***************************
 * Load and apply settings
 ***************************/
function changeTheme(theme: string) {
  switch (theme) {
    case "dark":
      $q.dark.set(true);
      break;

    case "light":
      $q.dark.set(false);
      break;
  }
}

function changeLanguage(language: string) {
  locale.value = language;
}

function changeFontSize(fontSize: string) {
  document.documentElement.style.fontSize = fontSize;
}

/*************************************************
 * GoldenLayout (set, rename, remove component)
 *************************************************/

/**
 * Set focus to component with specified id
 * create it if it doesn't exist
 * @param id - itemId
 */
async function setComponent(id: string) {
  let componentType = "";
  let title = "";
  switch (id) {
    case "library":
      componentType = "LibraryPage";
      title = t("library");
      break;
    case "help":
      componentType = "HelpPage";
      title = t("help");
      break;
    case "settings":
      componentType = "SettingsPage";
      title = t("settings");
      break;
    case "test": // for development testing
      componentType = "ExcalidrawPage";
      title = t("test");
      break;
    default:
      let item = (await getProject(id)) as Project | Note;
      if (item.dataType == "project") {
        componentType = "ReaderPage";
        title = item.title;
      } else if (item.dataType == "note") {
        if (item.type === "excalidraw") {
          componentType = "ExcalidrawPage";
          title = item.label;
        } else {
          componentType = "NotePage";
          title = item.label;
        }
      }
      break;
  }
  if (layout.value) await layout.value.addGLComponent(componentType, title, id);
  await saveLayout();
  await saveAppState();
}

/**
 * Closing the project need to close the related windows
 * @param id - itemId
 */
async function removeComponent(id: string) {
  if (!layout.value) return;
  layout.value.removeGLComponent(id);
  let item = await getProject(id);
  if (item?.dataType === "project") {
    let notes = await getNotes(id);
    for (let note of notes) {
      layout.value.removeGLComponent(note._id);
    }
  }
}

/**
 * After renaming a row in projectTree, we need to rename the window title.
 * @param item
 */
async function editComponentState(item: Project | Note | undefined) {
  if (!layout.value || !item) return;
  layout.value.renameGLComponent(item._id, item.label);
  let config = layout.value.getLayoutConfig();
  await updateLayout(config);
}

/***************************************************
 * Layout and AppState
 ***************************************************/

async function resizeLeftMenu(size: number) {
  if (layout.value) layout.value.resize();
  stateStore.leftMenuSize = size > 10 ? size : 10;
}

/**
 * When layout is changed, save layout and appstate
 */
async function onLayoutChanged() {
  await nextTick();

  // if the last window is closed, open library page
  // this is to prevent the undefined root problem
  if (!layout.value) return;
  let config = layout.value.getLayoutConfig();
  if (config.root === undefined) {
    setComponent("library");
    await nextTick();
  }

  // save layouts and appstate
  await saveLayout();
  await saveAppState();
}

async function saveLayout() {
  if (!layout.value || !layout.value.initialized) return;
  let config = layout.value.getLayoutConfig();
  await updateLayout(config);
}

async function saveAppState() {
  // if folders are not created yet
  // selectedFolderId is ""
  if (!!!stateStore.selectedFolderId) {
    stateStore.selectedFolderId = "library";
  }
  let state = stateStore.saveState();
  await updateAppState(state);
}

/*************************************************
 * onMounted
 *************************************************/
onMounted(async () => {
  let state = await getAppState();
  stateStore.loadState(state);

  // if there is no path, show welcome carousel
  if (!stateStore.settings.storagePath) {
    showWelcomeCarousel.value = true;
  }

  // apply layout related settings
  if (stateStore.showLeftMenu) leftMenuSize.value = state.leftMenuSize;
  let _layout = await getLayout();
  if (layout.value) await layout.value.loadGLLayout(_layout.config);

  // apply UI related settings
  changeTheme(stateStore.settings.theme);
  changeLanguage(stateStore.settings.language);
  changeFontSize(stateStore.settings.fontSize);

  // check if update is available
  // if available, show a blue dot on settings icon
  setTimeout(() => {
    window.updater.updateAvailable((event, isAvailable: boolean) => {
      isUpdateAvailable.value = isAvailable;
    });
  }, 1000);

  // the openItemIds are ready
  // we can load the projectTree
  ready.value = true;

  // event bus
  bus.on("updateProject", (e: BusEvent) => {
    if ((e.data as Note | Project).dataType === "project")
      editComponentState(e.data);
  });
});

onBeforeUnmount(() => {
  bus.off("updateProject", (e: BusEvent) => {
    if ((e.data as Note | Project).dataType === "project")
      editComponentState(e.data);
  });
});
</script>
