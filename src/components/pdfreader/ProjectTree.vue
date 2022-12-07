<template>
  <q-tree
    ref="tree"
    dense
    :duration="0"
    no-selection-unset
    selected-color="primary"
    :nodes="projects"
    node-key="key"
    v-model:selected="selected"
    v-model:expanded="expanded"
    @update:selected="selectItem"
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
            @click="selectItem(prop.key)"
          >
            <q-item-section> Open </q-item-section>
          </q-item>
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

      <!-- body of the tree node -->
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
      <div
        v-else
        class="ellipsis"
      >
        {{ prop.node.label }}
      </div>
    </template>
  </q-tree>
</template>

<script>
import { useStateStore } from "src/stores/appState";
import { addNote, deleteNote, modifyNote, getNotes } from "src/backend/note";

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

  mounted() {
    this.getProjectTree();
    // set selected
    this.selected = this.stateStore.workingProject._id;
    // set expanded
    this.expanded.push(this.selected);
  },

  watch: {
    "stateStore.openedProjects": {
      handler() {
        this.getProjectTree();
        this.selected = this.stateStore.workingProject._id;
        this.expanded.push(this.selected);
      },
      deep: true,
    },
  },

  methods: {
    menuSwitch(node) {
      if ("noteId" in node) {
        // show context menu for notes
        this.projectMenu = false;
      } else {
        // show context menu for project
        this.projectMenu = true;
      }
    },

    getProjectTree() {
      this.projects = [];

      let projects = this.stateStore.openedProjects;
      for (let p of projects) {
        // let notes = getNotes(p._id);
        let notes = [];
        for (let note of notes) {
          note.label = note.noteName;
          note.key = note.noteId;
        }

        // do not change openProjects directly
        // it will trigger recursive updates
        let project = {
          label: p.title,
          key: p._id,
          children: notes,
          projectId: p._id,
        };
        this.projects.push(project);
      }
    },

    selectItem(itemKey) {
      // open the markdown file for editing or set to different project
      this.selected = itemKey;
      let node = this.$refs.tree.getNodeByKey(itemKey);

      // set working project
      for (let project of this.stateStore.openedProjects) {
        if (project._id == node.projectId) {
          this.stateStore.workingProject = project;
        }
      }

      // set working note
      if (!!node.noteId) {
        if (this.stateStore.infoPaneSize == 0) this.stateStore.toggleInfoPane();
        this.stateStore.setInfoPaneTab("noteTab");
        this.stateStore.workingNote = node;
      }
    },

    closeProject(projectId) {
      this.stateStore.closeProject(projectId);
    },

    addNote(node) {
      // backend
      let note = {
        noteName: "New Note",
        projectId: node.key,
        links: {
          forward: [],
          backward: [],
        },
      };
      note = addNote(note);

      // update UI
      note.label = note.noteName;
      note.key = note.noteId;
      node.children.push(note);
      this.selectItem(note.noteId);
    },

    deleteNote(node) {
      // backend
      deleteNote(node);

      // update UI
      let parent = this.$refs.tree.getNodeByKey(node.projectId);
      parent.children = parent.children.filter(
        (child) => child.noteId != node.noteId
      );
      if (parent.children.length == 0) {
        this.selectItem(parent.projectId);
      } else {
        this.selectItem(parent.children[0].noteId);
      }

      // central store
      // if parent.children = [], workingNote=undefined
      this.stateStore.workingNote = parent.children[0];
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
      // backend
      let oldNote = this.renamingNote;
      let newNote = {
        noteName: oldNote.label,
        projectId: oldNote.projectId,
        noteId: oldNote.noteId,
        links: oldNote.links,
      };
      modifyNote(newNote);

      // UI
      // the label has been taken care by v-model of q-input
      this.renamingNote = null;
    },
  },
};
</script>
