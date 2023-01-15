<template>
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
          @dragstart="(e) => onDragStart(e, prop.node)"
          @dragover="(e) => onDragOver(e, prop.node)"
          @dragleave="(e) => onDragLeave(e, prop.node)"
          @drop="(e) => onDrop(e, prop.node)"
          @dragend="(e) => onDragEnd(e)"
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
                <q-item-section>Add Folder</q-item-section>
              </q-item>
              <q-item
                v-if="!specialFolderIds.includes(prop.node._id)"
                clickable
                v-close-popup
                @click="setRenameFolder(prop.node)"
              >
                <q-item-section>Rename</q-item-section>
              </q-item>
              <q-item
                clickable
                v-close-popup
                @click="exportFolder(prop.node)"
              >
                <q-item-section>Export References</q-item-section>
              </q-item>
              <q-item
                v-if="!specialFolderIds.includes(prop.node._id)"
                clickable
                v-close-popup
                @click="deleteFolder(prop.node)"
              >
                <q-item-section>Delete</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
          <!-- the body of a tree node -->
          <!-- icon width: 21px -->
          <q-icon :name="prop.node.icon" />
          <input
            v-if="renamingFolderId === prop.node._id"
            style="width: calc(100% - 21px)"
            ref="renameInput"
            v-model="prop.node.label"
            @blur="renameFolder"
            @keydown.enter="renameFolder"
          />
          <div
            v-else
            class="ellipsis"
          >
            {{ prop.node.label }}
          </div>
        </div>
      </template>
    </q-tree>
  </div>
</template>

<script>
import { useStateStore } from "src/stores/appState";
import {
  getFolderTree,
  addFolder,
  updateFolder,
  deleteFolder,
  moveFolderInto,
  getParentFolder,
} from "src/backend/project/folder";
import { sortTree } from "src/backend/project/utils";
import { getProject, updateProject } from "src/backend/project/project";
import { updateAppState } from "src/backend/appState";

export default {
  props: { draggingProjectId: String },
  emits: ["exportFolder"],

  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  data() {
    return {
      specialFolderIds: ["library"],
      folders: [],
      expandedKeys: ["library"],

      renamingFolderId: null,
      draggingNode: null,
      dragoverNode: null,
      enterTime: 0,
    };
  },

  async mounted() {
    this.folders = await getFolderTree();
  },

  methods: {
    async saveState() {
      if (!this.stateStore.ready) return;
      let state = this.stateStore.saveState();
      await updateAppState(state);
    },

    /**************************
     * Add, delete, update, export
     **************************/

    /**
     * Add folder to selected node
     * @param {Object} parentNode
     */
    async addFolder(parentNode) {
      // add to database
      let node = await addFolder(parentNode._id);

      // add to UI and expand the parent folder
      parentNode.children.push(node);
      this.expandedKeys.push(parentNode._id);

      // then rename it
      this.setRenameFolder(node);
    },

    /**
     * Delete selected folder
     * @param {Object} node
     */
    deleteFolder(node) {
      if (this.specialFolderIds.includes(node._id)) return;

      // remove from ui
      function _dfs(oldNode) {
        var newNode = [];
        for (let n of oldNode.children) {
          if (n._id !== node._id) {
            if (!newNode.children) newNode.children = [];
            newNode.push({
              icon: n.icon,
              label: n.label,
              _id: n._id,
              projectIds: n.projectIds,
              children: _dfs(n),
            });
          }
        }
        return newNode;
      }
      this.folders[0].children = _dfs(this.folders[0]);

      // remove from db
      deleteFolder(node._id);
    },

    /**
     * Reveal input to rename for selected folder
     * @param {Object} node
     */
    setRenameFolder(node) {
      this.renamingFolderId = node._id;

      setTimeout(() => {
        // wait till input appears
        // focus onto the input and select the text
        let input = this.$refs.renameInput;
        input.focus();
        input.select();
      }, 100);
    },

    /**
     * Hide input and update db and ui
     */
    renameFolder() {
      if (!!!this.renamingFolderId) return;

      // update db
      let node = this.$refs.tree.getNodeByKey(this.renamingFolderId);
      updateFolder(node._id, { label: node.label });

      // update ui
      this.renamingFolderId = null;

      // sort the tree
      sortTree(this.folders[0]);
    },

    /**
     * Export a collection of references
     * @param {Object} folder
     */
    exportFolder(folder) {
      this.$emit("exportFolder", folder);
    },

    /****************
     * Drag and Drop
     ****************/

    /**
     * On dragstart, set the dragging folder
     * @param {DragEvent} e
     * @param {Object} node
     */
    onDragStart(e, node) {
      this.draggingNode = node;
    },

    /**
     * When dragging node is over the folder, highlight and expand it.
     * @param {DragEvent} e
     * @param {Object} node
     */
    onDragOver(e, node) {
      // enable drop on the node
      e.preventDefault();

      // hightlight the dragover folder
      this.dragoverNode = node;

      // expand the node if this function is called over many times
      this.enterTime++;
      if (this.enterTime > 15) {
        if (node._id in this.expandedKeys) return;
        this.expandedKeys.push(node._id);
      }
    },

    /**
     * When the dragging node leaves the folders, reset the timer
     * @param {DragEvent} e
     * @param {Object} node
     */
    onDragLeave(e, node) {
      this.enterTime = 0;
    },

    /**
     * If draggingProjectId is not empty, then we are dropping project into folder
     * Otherwise we are dropping folder into another folder
     * @param {DragEvent} e
     * @param {Object} node
     */
    async onDrop(e, node) {
      if (this.draggingNode == node) return;
      // record this first otherwise dragend events makes it null
      let draggingNode = this.draggingNode;
      let dragoverNode = this.dragoverNode;
      let draggingProjectId = this.draggingProjectId;

      if (!!draggingProjectId) {
        // drag and drop project into folder
        let project = await getProject(draggingProjectId);
        if (!project.folderIds.includes(dragoverNode._id)) {
          project.folderIds.push(dragoverNode._id);
          await updateProject(project);
        }

        this.onDragEnd();
      } else {
        // drag folder into another folder
        // update ui (do this first since parentfolder will change)
        let dragParentFolder = await getParentFolder(draggingNode._id);
        let dragParentNode = this.$refs.tree.getNodeByKey(dragParentFolder._id);
        dragParentNode.children = dragParentNode.children.filter(
          (folder) => folder._id != draggingNode._id
        );
        node.children.push(draggingNode);

        // update db
        await moveFolderInto(draggingNode._id, node._id);
      }
    },

    /**
     * Remove highlights
     * @param {DragEvent} e
     */
    onDragEnd(e) {
      this.draggingNode = null;
      this.dragoverNode = null;
    },
  },
};
</script>
<style lang="scss">
.dragover {
  border: 1px solid aqua;
  background-color: rgba(0, 255, 255, 0.5);
}
</style>
