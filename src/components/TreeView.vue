<template>
  <q-tree
    dense
    no-connectors
    :duration="0"
    :nodes="stateStore.folders"
    node-key="id"
    v-model:expanded="expandedKeys"
    v-model:selected="selectedFolderId"
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
            v-if="!specialFolderKeys.includes(prop.node.id)"
            clickable
            v-close-popup
            @click="renameFolder(prop.node)"
          >
            <q-item-section>Rename</q-item-section>
          </q-item>
          <q-item
            v-if="!specialFolderKeys.includes(prop.node.id)"
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
        v-if="renamingFolderId === prop.node.id"
        outlined
        dense
        for="renameInput"
        v-model="prop.node.label"
        :autofocus="true"
        @focus="focusInput"
        @click="focusInput"
        @keydown.enter="blurInput"
      />
      <div v-else>
        {{ prop.node.label }}
      </div>
    </template>
  </q-tree>
</template>

<script>
import { v4 as uuidv4 } from "uuid";
import { useStateStore } from "src/stores/appState";
import { loadTree, saveTree } from "src/backend";

export default {
  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  data() {
    return {
      selectedFolderId: "library",
      specialFolderKeys: ["library", "favorites"],
      folders: [{ id: "library" }],
      expandedKeys: ["library"],

      renamingFolderId: null,
    };
  },

  watch: {
    selectedFolderId(folderId) {
      this.stateStore.selectedTreeNode = this.$refs.tree.getNodeByKey(folderId);
    },
  },

  mounted() {
    this.stateStore.folders = loadTree();
    this.$nextTick(() => {
      this.stateStore.selectedTreeNode =
        this.$refs.tree.getNodeByKey("library");
    });
  },

  methods: {
    addFolder(parentNode) {
      // add folder
      let node = {
        label: "New Folder",
        icon: "folder",
        children: [],
        id: uuidv4(),
        projectIds: [],
      };
      parentNode.children.push(node);
      this.expandedKeys.push(parentNode.id);
      saveTree();
    },

    deleteFolder(node) {
      if (["library", "favorites"].includes(node.id)) return;

      function _dfs(oldNode) {
        var newNode = [];
        for (let n of oldNode.children) {
          if (n.id !== node.id) {
            console.log(n);
            // newNode.children = _dfs(n);
            if (!newNode.children) newNode.children = [];
            newNode.push({
              icon: n.icon,
              label: n.label,
              id: n.id,
              projectIds: n.projectIds,
              children: _dfs(n),
            });
          }
        }

        return newNode;
      }
      // console.log(this.folders[0]);
      this.stateStore.folders[0].children = _dfs(this.stateStore.folders[0]);
      saveTree();
    },

    renameFolder(node) {
      this.renamingFolderId = node.id;
    },

    focusInput(e) {
      // TODO: maybe this can improve ?
      setTimeout(() => {
        e.target.focus();
      }, 100);
    },

    blurInput(e) {
      this.renamingFolderId = null;
      saveTree();
    },
  },
};
</script>
