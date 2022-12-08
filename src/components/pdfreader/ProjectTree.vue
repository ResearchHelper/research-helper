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
        @click="selectItem(prop.key)"
      >
        {{ prop.node.label }}
      </div>
    </template>
  </q-tree>
</template>

<script>
import { useStateStore } from "src/stores/appState";
import { useProjectStore } from "src/stores/projectStore";
import {
  getNotes,
  addNote,
  deleteNote,
  updateNote,
} from "src/api/project/note";

export default {
  setup() {
    const stateStore = useStateStore();
    const projectStore = useProjectStore();
    return { stateStore, projectStore };
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

  mounted() {
    this.getProjectTree();
    if (!!this.projectStore.workingNote) {
      this.selected = this.projectStore.workingNote._id;
    } else {
      this.selected = this.projectStore.workingProject._id;
    }
    this.expanded.push(this.projectStore.workingProject._id);
  },

  watch: {
    "projectStore.openedProjects": {
      handler() {
        this.getProjectTree();
        this.selected = this.projectStore.workingProject._id;
        this.expanded.push(this.selected);
      },
      deep: true,
    },
  },

  methods: {
    menuSwitch(node) {
      if (node.datatype == "note") {
        // show context menu for notes
        this.projectMenu = false;
      } else {
        // show context menu for project
        this.projectMenu = true;
      }
    },

    async getProjectTree() {
      this.projects = [];
      for (let p of this.projectStore.openedProjects) {
        let notes = await getNotes(p._id);
        let project = {
          _id: p._id,
          datatype: p.datatype,
          label: p.title,
          children: notes,
          path: p.path,
        };
        this.projects.push(project);
      }
    },

    selectItem(itemKey) {
      // console.log("click:", itemKey);
      // open the markdown file for editing or set to different project
      this.selected = itemKey;
      let node = this.$refs.tree.getNodeByKey(itemKey);

      if (node.datatype == "note") {
        this.stateStore.openRightMenu("noteEditor");
        this.projectStore.workingNote = node;
      } else {
        // datatype == "project"
        if (this.stateStore.rightMenuSize > 0)
          this.stateStore.setRightMenuMode("infoPane");
        this.projectStore.workingProject = node;
        this.projectStore.workingNote = null;
        this.expanded.push(itemKey);
      }
    },

    closeProject(projectId) {
      // remove from opened projects
      this.projectStore.openedProjects =
        this.projectStore.openedProjects.filter(
          (project) => project._id != projectId
        );

      if (this.projectStore.openedProjects.length == 0) {
        this.stateStore.setCurrentPage("library");
      } else {
        // if this is workingProject, change it to something else
        if (projectId == this.projectStore.workingProject._id) {
          this.projectStore.workingProject =
            this.projectStore.openedProjects[0];
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
        this.selectItem(parent._id);
      } else {
        this.selectItem(parent.children[0]._id);
      }

      // central store
      // if parent.children = [], workingNote=undefined
      this.projectStore.workingNote = parent.children[0];
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
