<template>
  <q-scroll-area style="height: 100%">
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
        <q-icon :name="prop.node.icon" />
        <q-input
          v-if="renamingFolderId === prop.node._id"
          outlined
          dense
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
      </template>
    </q-tree>
  </q-scroll-area>
</template>

<script>
import { useStateStore } from "src/stores/appState";
import {
  getFolderTree,
  addFolder,
  updateFolder,
  deleteFolder,
} from "src/backend/project/folder";

export default {
  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  data() {
    return {
      // selectedFolderId: "library",
      specialFolderIds: ["library"],
      folders: [{ _id: "library" }],
      expandedKeys: ["library"],

      renamingFolderId: null,
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
            console.log(n);
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
      let node = this.$refs.tree.getNodeByKey(this.renamingFolderId);

      // change objects in children to folderIds
      let newNode = JSON.parse(JSON.stringify(node));
      for (let i in newNode.children) {
        newNode.children[i] = newNode.children[i]._id;
      }
      updateFolder(newNode);

      this.renamingFolderId = null;
    },
  },
};
</script>
