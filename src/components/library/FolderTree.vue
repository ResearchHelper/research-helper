<template>
  <!--
    div spans the entire background.
    q-tree only spans enough height to display its elements
  -->
  <div style="height: 100%">
    <q-tree
      dense
      no-connectors
      :duration="0"
      :nodes="folders"
      node-key="_id"
      v-model:expanded="expandedKeys"
      v-model:selected="stateStore.selectedFolderId"
      @update:selected="saveState"
      :no-selection-unset="true"
      selected-color="primary"
      ref="tree"
    >
      <template v-slot:default-header="prop">
        <div
          class="row full-width"
          :class="{
            dragover:
              !!dragoverNode &&
              dragoverNode == prop.node &&
              draggingNode != prop.node,
          }"
          draggable="true"
          @dragstart="(e: DragEvent) => onDragStart(e, prop.node)"
          @dragover="(e: DragEvent) => onDragOver(e, prop.node)"
          @dragleave="(e: DragEvent) => onDragLeave(e, prop.node)"
          @drop="((e: DragEvent) => onDrop(e, prop.node) as any)"
        >
          <q-menu
            touch-position
            context-menu
          >
            <q-list dense>
              <q-item
                clickable
                v-close-popup
                @click="addFolder(prop.node)"
              >
                <q-item-section>{{ $t("add-folder") }}</q-item-section>
              </q-item>
              <q-item
                v-if="!Object.values(SpecialFolder).includes(prop.node._id)"
                clickable
                v-close-popup
                @click="setRenameFolder(prop.node)"
              >
                <q-item-section>{{ $t("rename") }}</q-item-section>
              </q-item>
              <q-item
                clickable
                v-close-popup
                @click="exportFolder(prop.node)"
              >
                <q-item-section>{{ $t("export-references") }}</q-item-section>
              </q-item>
              <q-item
                v-if="!Object.values(SpecialFolder).includes(prop.node._id)"
                clickable
                v-close-popup
                @click="deleteFolder(prop.node)"
              >
                <q-item-section>{{ $t("delete") }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
          <!-- the body of a tree node -->
          <!-- icon width: 1.5rem -->
          <q-icon
            size="1.5rem"
            :name="prop.node.icon"
          />
          <!-- input must have keypress.space.stop since space is default to expand row rather than space in text -->
          <input
            v-if="renamingFolderId === prop.node._id"
            style="width: calc(100% - 1.5rem)"
            ref="renameInput"
            v-model="prop.node.label"
            @blur="renameFolder"
            @keydown.enter="renameFolder"
            @keypress.space.stop
          />
          <div
            v-else
            style="font-size: 1rem"
            class="ellipsis"
          >
            {{ prop.node.label }}
          </div>
        </div>
      </template>
    </q-tree>
  </div>
</template>

<script setup lang="ts">
// types
import { onMounted, ref, watch } from "vue";
import { Folder, SpecialFolder } from "src/backend/database";
import { QTree, QTreeNode } from "quasar";
//db
import { useStateStore } from "src/stores/appState";
import {
  getFolderTree,
  addFolder as addFolderDB,
  updateFolder,
  deleteFolder as deleteFolderDB,
  moveFolderInto,
  getParentFolder,
} from "src/backend/project/folder";
import { updateProject } from "src/backend/project/project";
import { updateAppState } from "src/backend/appState";
import { sortTree } from "src/backend/project/utils";
import { useI18n } from "vue-i18n";

const stateStore = useStateStore();
const { t } = useI18n({ useScope: "global" });

const emit = defineEmits(["exportFolder"]);

const renameInput = ref<HTMLInputElement | null>(null);
const tree = ref<QTree | null>(null);

const folders = ref<QTreeNode[]>([]);
const expandedKeys = ref(["library"]);
const renamingFolderId = ref("");
const draggingNode = ref<Folder | null>(null);
const dragoverNode = ref<Folder | null>(null);
const enterTime = ref(0);

// change folder lable if locale changed
watch(
  () => stateStore.settings.language,
  () => {
    for (let id of Object.values(SpecialFolder)) {
      let node = tree.value?.getNodeByKey(id) as QTreeNode;
      node.label = t(id);
    }
  }
);

onMounted(async () => {
  folders.value = (await getFolderTree()) as QTreeNode[];
  folders.value[0].label = t("library");

  // add other special folders
  folders.value.push({
    _id: "added",
    label: t("added"),
    icon: "history",
  });
  folders.value.push({
    _id: "favorites",
    label: t("favorites"),
    icon: "star",
  });
});

async function saveState() {
  if (!stateStore.ready) return;
  let state = stateStore.saveState();
  await updateAppState(state);
}

/**************************
 * Add, delete, update, export
 **************************/

/**
 * Add folder to selected node
 * @param parentNode
 * @param label - folder name
 */
async function addFolder(parentNode: Folder, label?: string, focus?: boolean) {
  // add to database
  let node = (await addFolderDB(parentNode._id)) as Folder;

  // set node label if we specify one
  if (!!label) {
    node.label = label;
    node = (await updateFolder(node._id, {
      label: node.label,
    } as Folder)) as Folder;
  }

  // add to UI and expand the parent folder
  parentNode.children.push(node);
  expandedKeys.value.push(parentNode._id);

  // focus on it
  if (focus) stateStore.selectedFolderId = node._id;

  // rename it if label is empty
  if (!!!label) setRenameFolder(node);
}

/**
 * Delete selected folder
 * @param node
 */
function deleteFolder(node: Folder) {
  if ((Object.values(SpecialFolder) as string[]).includes(node._id)) return;

  // remove from ui
  function _dfs(oldNode: Folder): Folder[] {
    var newNode = [] as Folder[];
    for (let n of oldNode.children) {
      if ((n as Folder)._id !== node._id) {
        // if (!newNode.children) newNode.children = [];
        newNode.push({
          _id: (n as Folder)._id,
          icon: (n as Folder).icon,
          label: (n as Folder).label,
          children: _dfs(n as Folder),
        } as Folder);
      }
    }
    return newNode;
  }
  folders.value[0].children = _dfs(folders.value[0] as Folder) as QTreeNode[];

  // remove from db
  deleteFolderDB(node._id);
}

/**
 * Reveal input to rename for selected folder
 * @param node
 */
function setRenameFolder(node: Folder) {
  renamingFolderId.value = node._id;

  setTimeout(() => {
    // wait till input appears
    // focus onto the input and select the text
    let input = renameInput.value;
    if (!input) return;
    input.focus();
    input.select();
  }, 100);
}

/**
 * Hide input and update db and ui
 */
function renameFolder() {
  if (!!!renamingFolderId.value) return;
  if (!tree.value) return;
  // update db
  let node = tree.value.getNodeByKey(renamingFolderId.value);
  updateFolder(node._id, { label: node.label } as Folder);

  // update ui
  renamingFolderId.value = "";

  // sort the tree
  sortTree(folders.value[0] as Folder);
}

/**
 * Export a collection of references
 * @param folder
 */
function exportFolder(folder: Folder) {
  emit("exportFolder", folder);
}

/****************
 * Drag and Drop
 ****************/

/**
 * On dragstart, set the dragging folder
 * @param e - dragevent
 * @param node - the folder user is dragging
 */
function onDragStart(e: DragEvent, node: Folder) {
  draggingNode.value = node;
}

/**
 * When dragging node is over the folder, highlight and expand it.
 * @param e - dragevent
 * @param node - the folder user is dragging
 */
function onDragOver(e: DragEvent, node: Folder) {
  // enable drop on the node
  e.preventDefault();

  // hightlight the dragover folder
  dragoverNode.value = node;

  // expand the node if this function is called over many times
  enterTime.value++;
  if (enterTime.value > 15) {
    if (node._id in expandedKeys.value) return;
    expandedKeys.value.push(node._id);
  }
}

/**
 * When the dragging node leaves the folders, reset the timer
 * @param e
 * @param node
 */
function onDragLeave(e: DragEvent, node: Folder) {
  enterTime.value = 0;
}

/**
 * If draggedProjects is not empty, then we are dropping projects into folder
 * Otherwise we are dropping folder into another folder
 * @param e - dragevent
 * @param node - the folder / project user is dragging
 */
async function onDrop(e: DragEvent, node: Folder) {
  // record this first otherwise dragend events makes it null
  let _dragoverNode = dragoverNode.value as Folder;
  let _draggingNode = draggingNode.value as Folder;
  let draggedProjectsRaw = e.dataTransfer?.getData("draggedProjects");

  if (draggedProjectsRaw) {
    // drag and drop project into folder
    for (let project of JSON.parse(draggedProjectsRaw)) {
      if (!project.folderIds.includes(_dragoverNode._id)) {
        project.folderIds.push(_dragoverNode._id);
        updateProject(project);
      }
    }
  } else {
    // drag folder into another folder
    // update ui (do this first since parentfolder will change)
    // if no dragging folder or droping a folder "into" itself, exit
    if (_draggingNode === null || draggingNode.value == node) return;
    if (!tree.value) return;
    let dragParentFolder = (await getParentFolder(_draggingNode._id)) as Folder;
    let dragParentNode = tree.value.getNodeByKey(
      dragParentFolder._id
    ) as Folder;
    dragParentNode.children = dragParentNode.children.filter(
      (folder) => (folder as Folder)._id != (_draggingNode as Folder)._id
    );
    node.children.push(_draggingNode);

    // update db
    await moveFolderInto(_draggingNode._id, node._id);
  }

  onDragEnd(e);
}

/**
 * Remove highlights
 * @param e - dragevent
 */
function onDragEnd(e: DragEvent) {
  draggingNode.value = null;
  dragoverNode.value = null;
}

function getLibraryNode() {
  if (!tree.value) return;
  return tree.value.getNodeByKey("library");
}

defineExpose({
  getLibraryNode,
  addFolder,
  onDragEnd,
});
</script>
<style lang="scss" scoped>
.dragover {
  border: 1px solid aqua;
  background-color: rgba(0, 255, 255, 0.5);
}
</style>
