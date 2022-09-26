<template>
  <q-table
    @row-click="clickRow"
    @row-dblclick="dblclickRow"
    @row-contextmenu="toggleContextMenu"
    :columns="headers"
    :rows="projects"
    row-key="title"
    hide-bottom
    :wrap-cells="true"
    dense
    :filter="stateStore.searchString"
  >
  </q-table>
  <q-menu
    touch-position
    context-menu
  >
    <q-list dense>
      <q-item
        clickable
        v-close-popup
        @click="dblclickRow"
      >
        <q-item-section>Open</q-item-section>
      </q-item>
      <q-separator />
      <q-item
        clickable
        v-close-popup
        @click="deleteProject(false)"
      >
        <q-item-section>Delete From Table</q-item-section>
      </q-item>
      <q-item
        clickable
        v-close-popup
        @click="deleteProject(true)"
      >
        <q-item-section>Delete From DataBase</q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>

<script>
import { useStateStore } from "../stores/appState";
import { deleteProject } from "src/backend";

export default {
  setup() {
    const stateStore = useStateStore();
    return { stateStore, deleteProject };
  },

  data() {
    return {
      headers: [
        {
          name: "title",
          field: "author",
          label: "Author(s)",
          align: "left",
        },
        {
          name: "year",
          field: "year",
          label: "Year",
          align: "left",
        },
        {
          name: "title",
          field: "title",
          label: "Title",
          align: "left",
        },
      ],

      projects: [],

      prvSelectedIndex: 0,
    };
  },

  watch: {
    "stateStore.selectedTreeNode.projectIds": {
      handler: function (projectIds) {
        this.getProjects(projectIds);
      },
      deep: true,
    },
  },

  methods: {
    getProjects(projectIds) {
      this.projects = [];
      for (let projectId of projectIds) {
        fetch("http://localhost:5000/project/" + projectId, {
          mode: "cors",
          method: "GET",
        })
          .then((response) => {
            return response.json();
          })
          .then((json) => {
            let info = json.info;
            info.files = json.files;
            info.id = projectId; // must id as key since the expandable row requires it
            this.projects.push(info);
          });
      }
    },

    clickRow(event, row, index) {
      this.stateStore.selectedProject = row;
      let rowEls = document.querySelectorAll("tr.cursor-pointer");
      // check if the previous row is deleted
      if (rowEls[this.prvSelectedIndex])
        rowEls[this.prvSelectedIndex].classList.remove("bg-primary");
      rowEls[index].classList.add("bg-primary");
      this.prvSelectedIndex = index;
    },

    dblclickRow(event, row, index) {
      this.stateStore.workingProject = row;
      for (let i = 0; i < this.stateStore.openedProjects.length; i++) {
        if (row.projectId === this.stateStore.openedProjects[i].projectId) {
          return;
        }
      }
      this.stateStore.openedProjects.push(row);
      this.stateStore.currentPage = "reader";
    },

    toggleContextMenu(event, row, index) {
      this.showContextMenu = true;
      this.clickRow(null, row, index);
    },

    searchProject(rows, terms, cols, getCellValue) {
      // TODO: implement a filter-method to search abstract and other things
      // see https://quasar.dev/vue-components/table#introduction filter-method
    },
  },
};
</script>
