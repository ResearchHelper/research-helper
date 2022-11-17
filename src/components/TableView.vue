<template>
  <div>
    <q-table
      class="stickyDynamic"
      virtual-scroll
      dense
      hide-bottom
      :columns="headers"
      :rows="projects"
      row-key="title"
      :wrap-cells="true"
      :filter="stateStore.searchString"
      @row-click="clickRow"
      @row-dblclick="dblclickRow"
      @row-contextmenu="toggleContextMenu"
    >
      <template v-slot:body-cell="props">
        <q-td :props="props">
          <div
            style="width: 20em"
            class="ellipsis"
          >
            {{ props.value }}
          </div>
        </q-td>

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
    </q-table>
  </div>
</template>

<script>
import { useStateStore } from "../stores/appState";
import { deleteProject, getProject } from "src/backend";

export default {
  setup() {
    const stateStore = useStateStore();
    return { stateStore, deleteProject, getProject };
  },
  data() {
    return {
      headers: [
        {
          name: "title",
          field: "title",
          label: "Title",
          align: "left",
        },
        {
          name: "author",
          field: "author",
          label: "Author(s)",
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
        this.projects.push(getProject(projectId));
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
      this.stateStore.setCurrentPage("reader");
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

<style lang="scss">
.stickyDynamic {
  /* height or max-height is important */
  height: 100%;

  .q-table__top,
  .q-table__bottom,
  thead tr:first-child th {
    /* bg color is important for th; just specify one */
    background-color: $dark;
  }

  thead tr th {
    position: sticky;
    z-index: 1;
  }
  /* this will be the loading indicator */
  thead tr:last-child th {
    /* height of all previous header rows */
    top: 48px;
  }
  thead tr:first-child th {
    top: 0;
  }
}
</style>
