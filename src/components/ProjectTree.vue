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
            :class="{
              dragover:
                dragoverNode == prop.node &&
                draggingNode != prop.node &&
                draggingNode.dataType == 'note' &&
                prop.node.dataType == 'project',
            }"
            draggable="true"
            @click="selectItem(prop.node)"
            @dragstart="(e) => onDragStart(e, prop.node)"
            @dragover="(e) => onDragOver(e, prop.node)"
            @drop="(e) => onDrop(e, prop.node)"
            @dragend="(e) => onDragEnd(e)"
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
            <input
              v-if="prop.node == renamingNote"
              ref="renameInput"
              v-model="prop.node.label"
              @keydown.enter="renameNote"
              @blur="renameNote"
            />

            <q-icon
              v-if="prop.node.dataType == 'note'"
              name="note"
            />
            <q-icon
              v-else
              name="import_contacts"
            />
            <div
              style="width: calc(100% - 23px)"
              class="ellipsis"
            >
              {{ prop.node.label }}
              <!-- <q-tooltip>{{ prop.key }}</q-tooltip> -->
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

        <template v-slot:default-body="prop">
          <!-- only nodes with same type can be reordered -->
          <div
            v-if="
              dragoverNode == prop.node &&
              draggingNode != prop.node &&
              draggingNode.dataType == prop.node.dataType
            "
            style="height: 10px"
            class="dragover"
            @dragover="(e) => onDragOverBelow(e, prop.node)"
            @drop="(e) => onDropBelow(e, prop.node)"
          ></div>
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
  addNote,
  deleteNote,
  updateNote,
  moveNoteInto,
  moveNoteBelow,
} from "src/backend/project/note";
import { getProject } from "src/backend/project/project";

export default {
  emits: ["closeProject", "openProject", "treedragstart"],

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
    },

    async pushProjectNode(projectId) {
      let project = await getProject(projectId);
      let notes = [];
      for (let noteId of project.notes) {
        let note = await getNote(noteId);
        // for convenience, we add projectId to notes
        note.projectId = projectId;
        notes.push(note);
      }

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
      if (!!!this.renamingNote) return;
      // update db
      updateNote(this.renamingNote._id, { label: this.renamingNote.label });

      // update ui
      this.renamingNote = null;
    },

    onDragStart(e, node) {
      // e.dataTranfser not working, have to use this work around
      this.$emit("treedragstart", node);

      this.draggingNode = node;

      setTimeout(() => {
        // collapse all projects to prevent dropping into notes
        if (node.dataType == "project") {
          this.prvExpanded = this.expanded;
          this.expanded = [];
        }
      }, 100);
    },

    onDragOver(e, node) {
      if (this.draggingNode.dataType == "note") e.preventDefault();
      this.dragoverNode = node;
    },

    /**
     * Drop note into another project. Last argument is optional,
     * pass the draggingNode is this.draggingNode is null
     * @param {DragEvent} e
     * @param {Map} node - project
     * @param {Map} draggingNode - note
     */
    async onDrop(e, node, draggingNode = null) {
      draggingNode = this.draggingNode || draggingNode;
      // drop note into another project and put it to last one
      if (draggingNode == node) return;
      if (node.dataType != "project") return; // can only drop into project
      if (draggingNode.projectId == node._id) return;

      // update ui
      // remove from parent project
      let parentNode = this.$refs.tree.getNodeByKey(draggingNode.projectId);
      parentNode.children = parentNode.children.filter(
        (note) => note._id != draggingNode._id
      );

      // add to target project
      draggingNode.projectId = node._id;
      node.children.push(draggingNode);

      // upadate db
      await moveNoteInto(draggingNode._id, node._id);
    },

    onDragOverBelow(e, node) {
      e.preventDefault();
    },

    /**
     * Drop item below another item. Last argument is optional,
     * pass the draggingNode if this.draggingNode has null.
     * @param {DragEvent} e
     * @param {Map} node - project | note
     * @param {Map} draggingNode - project | note
     */
    async onDropBelow(e, node, draggingNode = null) {
      draggingNode = this.draggingNode || draggingNode;
      // do nothing if place at the same place
      if (draggingNode == node) return;
      // only nodes with same type can be reordered
      if (draggingNode.dataType != node.dataType) return;

      if (draggingNode.dataType == "project") {
        // reorder projects
        // update ui
        let from = this.projects.findIndex((p) => p._id == draggingNode._id);
        let to = this.projects.findIndex((p) => p._id == node._id);
        this.projects.splice(to, 0, this.projects.splice(from, 1)[0]);

        // update db
        this.stateStore.openedProjectIds = this.projects.map((p) => p._id);
      } else {
        // reorder notes
        if (draggingNode.projectId == node.projectId) {
          // reorder within the same project
          // update ui
          let parent = this.$refs.tree.getNodeByKey(draggingNode.projectId);
          let from = parent.children.findIndex(
            (p) => p._id == draggingNode._id
          );
          let to = parent.children.findIndex((p) => p._id == node._id);
          parent.children.splice(
            parseInt(to) + 1,
            0,
            parent.children.splice(from, 1)[0]
          );

          // update db
          await moveNoteBelow(draggingNode._id, node._id);
        } else {
          // reorder notes across projects
          let dropParentNode = this.$refs.tree.getNodeByKey(node.projectId);
          await this.onDrop(null, dropParentNode, draggingNode);
          await this.onDropBelow(null, node, draggingNode);
        }
      }
    },

    /**
     * When dragevent ends, clear all data
     * @param {DragEvent} e
     */
    onDragEnd(e) {
      if (this.draggingNode.dataType == "project")
        this.expanded = this.prvExpanded;
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
