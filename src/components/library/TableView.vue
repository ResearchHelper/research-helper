<template>
  <div>
    <ActionBar
      :rightMenuSize="rightMenuSize"
      @toggle-right-menu="(show) => $emit('toggleRightMenu', show)"
      @addProject="addProject"
      ref="actionBar"
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
      :filter="$refs.actionBar ? $refs.actionBar.searchString : ''"
      :filter-method="searchProject"
    >
      <template v-slot:body="props">
        <q-tr
          style="cursor: pointer"
          :props="props"
          :class="{
            'bg-primary': props.key == stateStore.selectedProjectId,
          }"
          draggable="true"
          @click="clickProject(props.row, props.rowIndex)"
          @dblclick="dblclickProject(props.row)"
          @contextmenu="toggleContextMenu(props.row)"
          @dragstart="onDragStart(props.key)"
          @dragend="onDragEnd"
        >
          <q-td
            v-for="col in props.cols"
            :key="col.name"
            :props="props"
          >
            <div
              style="width: 20em"
              class="ellipsis"
            >
              {{ col.value }}
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
                @click="dblclickProject"
              >
                <q-item-section>Open</q-item-section>
              </q-item>
              <q-separator />
              <q-item
                clickable
                v-close-popup
                @click="copyProjectId"
              >
                <q-item-section>Copy Project ID</q-item-section>
              </q-item>
              <q-separator />
              <q-item
                v-if="stateStore.selectedFolderId != 'library'"
                clickable
                v-close-popup
                @click="deleteProject(false)"
              >
                <q-item-section>Delete From Folder</q-item-section>
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
        </q-tr>
        <q-tr
          v-show="!!$refs.actionBar.searchString"
          :props="props"
        >
          <div
            style="position: absolute; width: 100%"
            class="q-px-md ellipsis"
            v-html="expansionText[props.rowIndex]"
          ></div>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<script>
import ActionBar from "./ActionBar.vue";
import { copyToClipboard } from "quasar";
import { useStateStore } from "src/stores/appState";
import {
  getProjectsByFolderId,
  deleteProject,
} from "src/backend/project/project";

export default {
  props: { rightMenuSize: Number },
  emits: ["toggleRightMenu", "dragProject"],

  components: {
    ActionBar,
  },

  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  async mounted() {
    this.projects = await getProjectsByFolderId(
      this.stateStore.selectedFolderId
    );
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

      // for search
      showExpansion: false,
      expansionText: [],

      // for update
      selectedProjectIndex: null,
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
    addProject(project) {
      // update db has been done in action bar
      // update ui
      this.projects.push(project);
    },

    updateProject(project) {
      this.projects[this.selectedProjectIndex] = project;
    },

    deleteProject(deleteFromDB) {
      // update db
      deleteProject(this.stateStore.selectedProjectId, deleteFromDB);
      // update ui
      this.projects = this.projects.filter(
        (p) => p._id != this.stateStore.selectedProjectId
      );
    },

    clickProject(row, rowIndex) {
      this.stateStore.selectedProjectId = row._id;
      this.selectedProjectIndex = rowIndex;
    },

    dblclickProject(row) {
      this.stateStore.openItemId = row._id;
    },

    toggleContextMenu(row) {
      this.showContextMenu = true;
      this.clickProject(row);
    },

    async copyProjectId() {
      await copyToClipboard(this.stateStore.selectedProjectId);
    },

    searchProject(rows, terms, cols, getCellValue) {
      this.expansionText = [];
      let text = "";
      let re = RegExp(terms, "i"); // case insensitive
      let filtered = rows.filter((row) => {
        for (let prop in row) {
          if (prop == "tags") {
            for (let tag of row.tags) {
              if (tag.search(re) != -1) {
                text = tag.replace(
                  re,
                  `<span class="bg-primary">${terms}</span>`
                );
                this.expansionText.push("tag: " + text);
                return true;
              }
            }
          } else if (prop != "related" && prop != "folderIds") {
            if (prop == "year") row[prop] = String(row[prop]);

            if (row[prop].search(re) != -1) {
              text = row[prop].replace(
                re,
                `<span class="bg-primary">${terms}</span>`
              );
              this.expansionText.push(`${prop}: ${text}`);
              return true;
            }
          }
        }
        return false;
      });
      this.showExpansion = true;
      return filtered;
    },

    onDragStart(key) {
      this.$emit("dragProject", key);
    },

    onDragEnd() {
      this.$emit("dragProject", "");
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
