<template>
  <q-tree
    ref="tree"
    dense
    no-transition
    no-selection-unset
    selected-color="primary"
    :nodes="projects"
    node-key="_id"
    v-model:selected="selected"
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
</template>

<script>
import { useStateStore } from "src/stores/appState";
import {
  getNotes,
  addNote,
  deleteNote,
  updateNote,
} from "src/backend/project/note";
import { getProject } from "src/backend/project/project";

export default {
  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  data() {
    return {
      // tree
      projects: [],
      selected: null,
      expanded: [],

      // rename
      renamingNote: null,
    };
  },

  async mounted() {
    await this.getProjectTree();
    if (!!this.stateStore.workingNoteId) {
      this.selected = this.stateStore.workingNoteId;
    } else {
      this.selected = this.stateStore.workingProjectId;
    }
    this.expanded.push(this.stateStore.workingProjectId);
  },

  watch: {
    "stateStore.workingProjectId"(projectId, _) {
      this.selected = projectId;
      this.expanded.push(this.selected);
      console.log("setting project to", projectId);
      this.getProjectTree();
    },

    "stateStore.workingNoteId"(noteId, _) {
      if (!!!noteId) return;
      console.log("setting note to", noteId);
      this.selected = noteId;
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
        let project = await getProject(projectId);
        let notes = await getNotes(project._id);
        this.projects.push({
          _id: project._id,
          dataType: project.dataType,
          label: project.title,
          children: notes,
          path: project.path,
        });
      }
      // set to current project after getting all projects
      this.selected = this.stateStore.workingProjectId;
    },

    selectItem(node) {
      // open the markdown file for editing or set to different project
      this.selected = node._id;

      if (node.dataType == "note") {
        this.stateStore.openRightMenu("noteEditor");
        this.stateStore.workingNoteId = node._id;
      } else if (node.dataType == "project") {
        if (this.stateStore.rightMenuSize > 0)
          this.stateStore.setRightMenuMode("infoPane");
        this.stateStore.workingProjectId = node._id;
        this.stateStore.workingNoteId = null;
        this.expanded.push(node._id);
      }
    },

    closeProject(projectId) {
      // remove from opened projects
      this.stateStore.openedProjectIds =
        this.stateStore.openedProjectIds.filter((id) => id != projectId);

      if (this.stateStore.openedProjectIds.length == 0) {
        this.stateStore.setCurrentPage("library");
      } else {
        // change projectId when closing currently working project
        if (projectId == this.stateStore.workingProjectId) {
          console.log("closing", projectId);
          this.stateStore.workingProjectId = this.projects[0]._id;
        }
      }
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

      // central store
      // if parent.children = [], workingNote=undefined
      this.stateStore.workingNoteId = parent.children[0]._id;
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
