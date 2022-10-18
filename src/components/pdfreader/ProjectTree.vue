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
    @update:selected="clickItem"
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
      </q-menu>

      <!-- body of the tree node -->
      <div class="ellipsis">{{ prop.node.label }}</div>
    </template>
  </q-tree>
</template>

<script>
import { useStateStore } from "src/stores/appState";

export default {
  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  data() {
    return {
      projects: [],

      selected: null,
      expanded: [],
    };
  },

  mounted() {
    this.getProjectTree();
    // set selected
    this.selected = this.stateStore.workingProject.projectId;
    // set expanded
    this.expanded.push(this.selected);
  },

  watch: {
    "stateStore.openedProjects": {
      handler() {
        this.getProjectTree();
        this.selected = this.stateStore.workingProject.projectId;
        this.expanded.push(this.selected);
      },
      deep: true,
    },
  },

  methods: {
    getProjectTree() {
      this.projects = [];

      let projects = this.stateStore.openedProjects;
      for (let p of projects) {
        let project = {
          label: p.title,
          key: p.projectId,
          children: [],
        };
        for (let file of p.files) {
          if (
            window.path.extname(file) == ".md" ||
            window.path.extname(file) == ".pdf"
          )
            project.children.push({
              label: file,
              key: file,
            });
        }

        this.projects.push(project);
      }
    },

    clickItem(itemKey) {
      // open the markdown file for editing
      // or set to different project
      for (let project of this.stateStore.openedProjects) {
        if (itemKey === project.projectId) {
          this.expanded.push(itemKey);
          this.stateStore.workingProject = project;
        }
      }
    },

    addNote(node) {
      console.log(node);
    },

    closeProject(projectId) {
      this.stateStore.closeProject(projectId);
    },
  },
};
</script>
