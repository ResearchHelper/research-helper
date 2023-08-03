<template>
  <q-splitter
    :model-value="40"
    unit="px"
    :separator-style="{ cursor: 'default' }"
  >
    <template v-slot:before>
      <LeftRibbon
        v-model:isLeftMenuVisible="stateStore.showLeftMenu"
        @openPage="(page: Page) => setComponent(page)"
      />
    </template>
    <template v-slot:after>
      <q-splitter
        :limits="[0, 60]"
        emit-immediately
        :separator-class="{
          'q-splitter-separator': stateStore.showLeftMenu,
        }"
        :disable="!stateStore.showLeftMenu"
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
            v-model:currentPageId="stateStore.currentPageId"
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
import { Project, Note, BusEvent, Page, NoteType } from "src/backend/database";
// components
import LeftRibbon from "./LeftRibbon.vue";
import LeftMenu from "src/components/leftmenu/LeftMenu.vue";
// GoldenLayout
import GLayout from "./GLayout.vue";
import "src/css/goldenlayout/base.scss";
import "src/css/goldenlayout/theme.scss";
// db
import { useStateStore } from "src/stores/appState";
import { getNote } from "src/backend/project/note";
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
  provide,
  ref,
  watch,
} from "vue";
import { useI18n } from "vue-i18n";
import { EventBus } from "quasar";
import pluginManager from "src/backend/plugin";

interface PageItem {
  _id: string;
  label: string;
}

const stateStore = useStateStore();
const { t } = useI18n({ useScope: "global" });
const bus = inject("bus") as EventBus;

/*************************************************
 * Component refs, data, computed values
 *************************************************/
const layout = ref<InstanceType<typeof GLayout> | null>(null);
const leftMenu = ref<InstanceType<typeof LeftMenu> | null>(null);

const leftMenuSize = ref(0);
const ready = ref(false);

provide("onLayoutChanged", onLayoutChanged);

/*******************
 * Watchers
 *******************/
watch(
  () => stateStore.showLeftMenu,
  (visible: boolean) => {
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
  }
);

watch(
  () => stateStore.openedPage,
  (page: Page) => {
    setComponent(page);
  }
);

watch(
  () => stateStore.closedPageId,
  async (id: string) => {
    if (!!!id) return;
    let note = (await getNote(id)) as Note;
    if (note.dataType == "note" && note.type == NoteType.EXCALIDRAW) {
      // have to wait until the excalidraw component disappear
      setTimeout(() => {
        removeComponent(id);
      }, 100);
    } else removeComponent(id);
    // clear this so we can reclose a reopened item
    stateStore.closedPageId = "";
  }
);

// must convert Set to Array first
watch(
  () => [...stateStore.openedProjectIds],
  () => {
    saveAppState();
  }
);

// change special page title when locale updated
watch(
  () => stateStore.settings.language,
  () => {
    for (let id of ["library", "settings", "help"])
      editComponentState({ _id: id, label: t(id) });
  }
);

/*******************************************************
 * Methods
 *******************************************************/
/*************************************************
 * GoldenLayout (set, rename, remove component)
 *************************************************/

/**
 * Set focus to component with specified id
 * create it if it doesn't exist
 * @param id - itemId
 */
async function setComponent(page: Page) {
  if (layout.value)
    await layout.value.addGLComponent(
      page.type,
      page.label,
      page.id,
      page.data
    );
  await saveLayout();
  await saveAppState();
}

/**
 * Closing the project need to close the related windows
 * @param id - itemId
 */
function removeComponent(id: string) {
  if (layout.value) layout.value.removeGLComponent(id);
}

/**
 * After renaming a row in projectTree, we need to rename the window title.
 * @param item
 */
async function editComponentState(item: PageItem | undefined) {
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
  if (size < 8) {
    leftMenuSize.value = 0;
    stateStore.ribbonToggledBtnUid = "";
    // this will trigger stateStore.showLeftMenu = false;
  }
  stateStore.leftMenuSize = size > 10 ? size : 20;
  saveLayout();
  saveAppState();
}

/**
 * When layout is changed, save layout and appstate
 */
async function onLayoutChanged() {
  await nextTick();

  // if the last window is closed, open library page
  // this is to prevent the undefined root problem
  if (!layout.value || !ready.value) return;
  let config = layout.value.getLayoutConfig();
  if (config.root === undefined) {
    setComponent({
      id: "library",
      label: t("library"),
      type: "LibraryPage",
    });
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

/**
 *
 */
function onUpdateProject(project: Project) {
  editComponentState(project);
  if (!project.children) return;
  for (let note of project.children) {
    editComponentState(note);
  }
}

/*************************************************
 * onMounted
 *************************************************/
onMounted(async () => {
  let state = await getAppState();
  stateStore.loadState(state);
  pluginManager.init(); // initialize pluginManager after storagePath is set

  // apply layout related settings
  if (stateStore.showLeftMenu) leftMenuSize.value = state.leftMenuSize;
  let _layout = await getLayout();
  if (layout.value) await layout.value.loadGLLayout(_layout.config);

  // the openItemIds are ready
  // we can load the projectTree
  ready.value = true;

  // event bus
  bus.on("updateProject", (e: BusEvent) => onUpdateProject(e.data));
});

onBeforeUnmount(() => {
  bus.off("updateProject", (e: BusEvent) => onUpdateProject(e.data));
});
</script>
