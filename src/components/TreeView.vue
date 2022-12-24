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
      :no-selection-unset="true"
      selected-color="primary"
      ref="tree"
    >
      <template v-slot:default-header="prop">
        <div
          class="row full-width"
          :class="{
            dragover:
              dragoverNode == prop.node && draggingNode != prop.node && !below,
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
      <template v-slot:default-body="prop">
        <div
          v-if="dragoverNode == prop.node && this.draggingNode != prop.node"
          style="height: 10px"
          :class="{ dragover: below }"
          @dragover="(e) => onDragOverBelow(e, prop.node)"
          @drop="(e) => onDropBelow(e, prop.node)"
        ></div>
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
  moveFolderBelow,
  getParentFolder,
} from "src/backend/project/folder";

export default {
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
      below: false,
    };
  },

  async mounted() {
    this.folders = await getFolderTree();
    this.stateStore.selectedFolderId = "library";
  },

  methods: {
    async addFolder(parentNode) {
      // add to database
      let node = await addFolder(parentNode._id);

      // add to UI and expand the parent folder
      parentNode.children.push(node);
      this.expandedKeys.push(parentNode._id);
    },

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

    renameFolder() {
      if (!!!this.renamingFolderId) return;

      // update db
      let node = this.$refs.tree.getNodeByKey(this.renamingFolderId);
      updateFolder(node._id, { label: node.label });

      // update ui
      this.renamingFolderId = null;
    },

    onDragStart(e, node) {
      this.draggingNode = node;
    },

    onDragOver(e, node) {
      // enable drop on the node
      e.preventDefault();

      // hightlight the dragover folder
      this.dragoverNode = node;
      this.below = false;

      // expand the node if this function is called over many times
      this.enterTime++;
      if (this.enterTime > 15) {
        if (node._id in this.expandedKeys) return;
        this.expandedKeys.push(node._id);
      }
    },

    onDragLeave(e, node) {
      this.enterTime = 0;
    },

    onDragOverBelow(e, node) {
      e.preventDefault();
      this.below = true;
    },

    async onDrop(e, node) {
      if (this.draggingNode == node) return;
      // record this first otherwise dragend events makes it null
      let draggingNode = this.draggingNode;

      // update ui (do this first since parentfolder will change)
      let dragParentFolder = await getParentFolder(draggingNode._id);
      let dragParentNode = this.$refs.tree.getNodeByKey(dragParentFolder._id);
      dragParentNode.children = dragParentNode.children.filter(
        (folder) => folder._id != draggingNode._id
      );
      node.children.push(draggingNode);

      // update db
      await moveFolderInto(draggingNode._id, node._id);
    },

    async onDropBelow(e, node) {
      if (this.draggingNode == node) return;
      let draggingNode = this.draggingNode;

      // update ui
      let dragParentFolder = await getParentFolder(draggingNode._id);
      let dropParentFolder = await getParentFolder(node._id);
      let dragParentNode = this.$refs.tree.getNodeByKey(dragParentFolder._id);
      let dropParentNode = this.$refs.tree.getNodeByKey(dropParentFolder._id);
      dragParentNode.children = dragParentNode.children.filter(
        (n) => n._id != draggingNode._id
      );

      for (let i in dropParentNode.children) {
        if (dropParentNode.children[i]._id == node._id) {
          // must convert i to integer!!!
          // insert draggingNode at the drop node bottom (at position i+1)
          dropParentNode.children.splice(parseInt(i) + 1, 0, draggingNode);
          break;
        }
      }

      // update db
      moveFolderBelow(draggingNode._id, node._id);
    },

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
