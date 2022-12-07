<template>
  <div>
    <ActionBar
      @insertRow="(project) => projects.push(project)"
      @search="(str) => (searchString = str)"
    />
    <q-table
      class="stickyDynamic"
      virtual-scroll
      dense
      hide-bottom
      :columns="headers"
      :rows="projects"
      row-key="_id"
      :wrap-cells="true"
      :filter="searchString"
      @row-click="clickRow"
      @row-dblclick="dblclickRow"
      @row-contextmenu="toggleContextMenu"
    >
      <template v-slot:body-cell="props">
        <q-td
          :props="props"
          :class="{
            'bg-primary':
              !!stateStore.selectedProject &&
              props.key == stateStore.selectedProject._id,
          }"
        >
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
              v-if="stateStore.selectedFolderId != 'library'"
              clickable
              v-close-popup
              @click="deleteRow(false)"
            >
              <q-item-section>Delete From Table</q-item-section>
            </q-item>
            <q-item
              clickable
              v-close-popup
              @click="deleteRow(true)"
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
import ActionBar from "../components/ActionBar.vue";
import { useStateStore } from "../stores/appState";
import {
  getProjectsByFolderId,
  deleteProject,
} from "src/api/project/projectInfo";

export default {
  components: {
    ActionBar,
  },

  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  mounted() {
    getProjectsByFolderId(this.stateStore.selectedFolderId).then((projects) => {
      this.projects = projects;
      this.stateStore.selectedProject = this.projects[0];
    });
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
      searchString: "",
    };
  },

  watch: {
    "stateStore.selectedFolderId"(folderId, _) {
      getProjectsByFolderId(folderId).then(
        (projects) => (this.projects = projects)
      );
    },
  },

  methods: {
    deleteRow(deleteFromDB) {
      // update db
      let project = this.stateStore.selectedProject;
      deleteProject(project, deleteFromDB);

      // update ui
      this.projects = this.projects.filter((p) => p._id != project._id);
    },

    clickRow(event, row, index) {
      this.stateStore.selectedProject = row;
    },

    dblclickRow(event, row, index) {
      this.stateStore.workingProject = row;
      for (let i = 0; i < this.stateStore.openedProjects.length; i++) {
        if (row._id === this.stateStore.openedProjects[i]._id) {
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
