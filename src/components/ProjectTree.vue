<template>
  <div>
    <q-expansion-item
      dense
      dense-toggle
      expand-separator
      default-opened
      label="Active projects"
    >
      <q-tree
        ref="tree"
        dense
        no-transition
        no-selection-unset
        no-nodes-label="No working projects"
        :nodes="projects"
        node-key="_id"
        selected-color="primary"
        v-model:selected="stateStore.workingItemId"
        v-model:expanded="expanded"
      >
        <template v-slot:default-header="prop">
          <!-- use full-width so that click trailing empty space 
        of the node still fires click event -->
          <!-- only note can drop into a project -->
          <div
            style="width: calc(100% - 23px)"
            class="row"
            @click="selectItem(prop.node)"
          >
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

            <q-icon
              v-if="prop.node.dataType == 'note'"
              name="note"
            />
            <q-icon
              v-else
              name="import_contacts"
            />
            <input
              v-if="prop.node == renamingNote"
              style="width: calc(100% - 21px)"
              v-model="prop.node.label"
              @keydown.enter="renameNote"
              @blur="renameNote"
              ref="renameInput"
            />
            <!-- add item-id and type for access of drag source -->
            <div
              v-else
              style="width: calc(100% - 23px)"
              class="ellipsis"
              :item-id="prop.key"
              :type="prop.node.dataType"
            >
              {{ prop.node.label }}
              <q-tooltip>id: {{ prop.key }}</q-tooltip>
            </div>
          </div>
          <q-icon
            v-if="prop.node.dataType == 'project'"
            style="color: red"
            name="close"
            @click="closeProject(prop.key)"
          >
            <q-tooltip>Close project</q-tooltip>
          </q-icon>
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
  </div>
</template>

<script>
import GraphView from "./GraphView.vue";

import { useStateStore } from "src/stores/appState";
import {
  getNote,
  getNotes,
  addNote,
  deleteNote,
  updateNote,
} from "src/backend/project/note";
import { sortTree } from "src/backend/project/utils";
import { getProject } from "src/backend/project/project";

export default {
  emits: [
    "addNode",
    "renameNode",
    "closeProject",
    "openProject",
    "treedragstart",
  ],

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
      prvExpanded: [],
      renamingNote: null,

      draggingNode: null,
      dragoverNode: null,
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
    "stateStore.openItemId"(id) {
      if (!!!id) return;
      this.stateStore.openProject(id);
      let node = this.$refs.tree.getNodeByKey(id);
      if (!!!node) {
        this.pushProjectNode(id);
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

      // sort notes in each project
      for (let i in this.projects) {
        sortTree(this.projects[i]);
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

      await this.$nextTick();
      let element = this.$refs.tree.$el.querySelector(
        `[item-id='${projectId}']`
      );
      this.$emit("addNode", element);

      for (let note of notes) {
        this.$emit(
          "addNode",
          this.$refs.tree.$el.querySelector(`[item-id='${note._id}']`)
        );
      }
    },

    selectItem(node) {
      this.stateStore.workingItemId = node._id;
      if (node.children?.length > 0) this.expanded.push(node._id);

      this.$emit("openProject", node._id);
    },

    async closeProject(projectId) {
      this.$emit("closeProject", projectId);

      let selected = this.stateStore.workingItemId;
      if (this.stateStore.workingItemId == projectId) {
        let index = this.stateStore.openedProjectIds.indexOf(projectId);
        index = index > 0 ? index - 1 : 0;
        selected = "library";
        if (this.stateStore.openedProjectIds.length > 1) {
          selected = this.stateStore.openedProjectIds[index];
        }
      }

      this.stateStore.openedProjectIds =
        this.stateStore.openedProjectIds.filter((id) => id != projectId);
      this.projects = this.projects.filter((p) => p._id != projectId);

      setTimeout(() => {
        this.stateStore.workingItemId = selected;
      }, 50);
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
      let index = this.projects.findIndex((p) => p.children.indexOf(node) > -1);
      let project = this.projects[index];

      project.children = project.children.filter(
        (child) => child._id != node._id
      );
      if (project.children.length == 0) {
        this.selectItem(project);
      } else {
        this.selectItem(project.children[0]);
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
      let renamingNote = this.renamingNote;
      if (!!!renamingNote) return;
      // update db
      updateNote(renamingNote._id, { label: renamingNote.label });

      // update ui
      this.renamingNote = null;
      let projectNode = this.$refs.tree.getNodeByKey(renamingNote.projectId);
      sortTree(projectNode); // sort notes

      this.$emit("renameNode", renamingNote);
    },
  },
};
</script>
