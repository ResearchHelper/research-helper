<template>
  <q-expansion-item
    dense
    dense-toggle
    expand-separator
    default-opened
    label="Projects"
  >
    <q-tree
      ref="tree"
      dense
      no-transition
      no-selection-unset
      selected-color="primary"
      no-nodes-label="No working projects"
      :nodes="projects"
      node-key="_id"
      v-model:selected="stateStore.workingItemId"
      v-model:expanded="expanded"
    >
      <template v-slot:default-header="prop">
        <q-menu
          touch-position
          context-menu
          @before-show="menuSwitch(prop.node)"
        >
          <!-- menu for project -->
          <q-list
            dense
            v-if="projectMenu"
          >
            <q-item
              clickable
              v-close-popup
              @click="addNote(prop.node)"
            >
              <q-item-section> Add Note </q-item-section>
            </q-item>
            <q-separator />
            <q-item
              clickable
              v-close-popup
              @click="closeProject(prop.key)"
            >
              <q-item-section> Close Project </q-item-section>
            </q-item>
          </q-list>

          <!-- menu for notes -->
          <q-list
            dense
            v-else
          >
            <q-item
              clickable
              v-close-popup
              @click="setRenameNote(prop.node)"
            >
              <q-item-section> Rename </q-item-section>
            </q-item>
            <q-item
              clickable
              v-close-popup
              @click="deleteNote(prop.node)"
            >
              <q-item-section> Delete </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
        <q-input
          v-if="prop.node == renamingNote"
          square
          outlined
          dense
          ref="renameInput"
          v-model="prop.node.label"
          @keydown.enter="renameNote"
          @blur="renameNote"
        />
        <!-- use width: 100% such that click trailing empty space 
        of the node still fires click event -->
        <div
          v-else
          style="width: 100%"
          class="ellipsis"
          @click="selectItem(prop.node)"
        >
          {{ prop.node.label }}
        </div>
        <q-icon
          v-if="prop.node.dataType == 'project'"
          name="cancel"
          @click="closeProject(prop.key)"
        />
      </template>
    </q-tree>
  </q-expansion-item>
  <q-expansion-item
    dense
    dense-toggle
    expand-separator
    label="Graph view"
  >
    <GraphView />
  </q-expansion-item>
</template>

<script>
import GraphView from "./GraphView.vue";

import { useStateStore } from "src/stores/appState";
import {
  getNotes,
  addNote,
  deleteNote,
  updateNote,
} from "src/backend/project/note";
import { getProject } from "src/backend/project/project";

export default {
  components: { GraphView },

  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  data() {
    return {
      // tree
      projects: [],
      expanded: [],
      renamingNote: null,
    };
  },

  async mounted() {
    await this.getProjectTree();
    let selected = this.stateStore.workingItemId;
    let selectedNode = this.$refs.tree.getNodeByKey(selected);
    if (!!selectedNode && selectedNode?.children?.length > 0)
      this.expanded.push(selected);
  },

  watch: {
    "stateStore.workingItemId"(id) {
      if (!!!id) return;
      if (["library", "settings"].includes(id)) return;

      let node = this.$refs.tree.getNodeByKey(id);
      if (!!node) {
        // if the id is in tree, then expand it if it has notes
        if (node.children?.length > 0) this.expanded.push(id);
      } else {
        // if the id is not in the tree, then it must be new project
        this.pushProjectNode(id);
        this.stateStore.openedProjectIds.push(id);
      }
    },
  },

  methods: {
    menuSwitch(node) {
      if (node.dataType == "note") {
        // show context menu for notes
        this.projectMenu = false;
      } else {
        // show context menu for project
        this.projectMenu = true;
      }
    },

    async getProjectTree() {
      this.projects = [];
      for (let projectId of this.stateStore.openedProjectIds) {
        await this.pushProjectNode(projectId);
      }
    },

    async pushProjectNode(projectId) {
      let project = await getProject(projectId);
      let notes = await getNotes(projectId);
      this.projects.push({
        _id: project._id,
        dataType: project.dataType,
        label: project.title,
        children: notes,
        path: project.path,
      });
      this.expanded.push(projectId);
    },

    selectItem(node) {
      this.stateStore.workingItemId = node._id;
      if (node.children?.length > 0) this.expanded.push(node._id);
    },

    closeProject(projectId) {
      // remove from opened projects
      this.stateStore.openedProjectIds =
        this.stateStore.openedProjectIds.filter((id) => id != projectId);

      // remove from this.projects
      this.projects = this.projects.filter((p) => p._id != projectId);

      // this.$emit("closeProject", projectId);
      // IMPROVE
      // have to wait sometime before removing from layout
      // otherwise the project will be open again, weired
      setTimeout(() => {
        this.$emit("closeProject", projectId);
      }, 100);
    },

    async addNote(node) {
      // update db
      let note = await addNote(node._id);

      // update ui
      node.children.push(note);
    },

    async deleteNote(node) {
      // update db
      await deleteNote(node._id);

      // update ui
      let parent = this.$refs.tree.getNodeByKey(node.projectId);

      parent.children = parent.children.filter(
        (child) => child._id != node._id
      );
      if (parent.children.length == 0) {
        this.selectItem(parent);
      } else {
        this.selectItem(parent.children[0]);
      }
    },

    setRenameNote(node) {
      // set renaming note and show input
      this.renamingNote = node;

      setTimeout(() => {
        // wait till input appears
        // focus onto the input and select the text
        let input = this.$refs.renameInput;
        input.focus();
        input.select();
      }, 100);
    },

    renameNote() {
      // update db
      updateNote(this.renamingNote._id, { label: this.renamingNote.label });

      // update ui
      this.renamingNote = null;
    },
  },
};
</script>
