<template>
  <div>
    <ActionBar />
    <q-table
      class="stickyDynamic"
      virtual-scroll
      dense
      hide-bottom
      :columns="headers"
      :rows="projectStore.projects"
      row-key="_id"
      :wrap-cells="true"
      :filter="projectStore.searchString"
      :filter-method="searchProject"
    >
      <template v-slot:body="props">
        <q-tr
          style="cursor: pointer"
          :props="props"
          :class="{
            'bg-primary':
              !!projectStore.selectedProject &&
              props.key == projectStore.selectedProject._id,
          }"
          @click="clickRow(props.row)"
          @dblclick="dblclickRow(props.row)"
          @contextmenu="toggleContextMenu(props.row)"
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
                @click="dblclickRow"
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
                @click="projectStore.delete(false)"
              >
                <q-item-section>Delete From Table</q-item-section>
              </q-item>
              <q-item
                clickable
                v-close-popup
                @click="projectStore.delete(true)"
              >
                <q-item-section>Delete From DataBase</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-tr>
        <q-tr
          v-show="!!projectStore.searchString"
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
import ActionBar from "../components/ActionBar.vue";
import { copyToClipboard } from "quasar";
import { useStateStore } from "../stores/appState";
import { useProjectStore } from "src/stores/projectStore";

export default {
  components: {
    ActionBar,
  },

  setup() {
    const stateStore = useStateStore();
    const projectStore = useProjectStore();
    return { stateStore, projectStore };
  },

  mounted() {
    this.projectStore.getProjects(this.stateStore.selectedFolderId);
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
      prvSelectedIndex: 0,
      showExpansion: false,
      expansionText: [],
    };
  },

  watch: {
    "stateStore.selectedFolderId"(folderId, _) {
      this.projectStore.getProjects(folderId);
    },
  },

  methods: {
    clickRow(row) {
      this.projectStore.selectedProject = row;
    },

    async dblclickRow(row) {
      await this.projectStore.setWorkingProject(row._id);
      this.stateStore.setCurrentPage("reader");
    },

    toggleContextMenu(row) {
      this.showContextMenu = true;
      this.clickRow(row);
    },

    async copyProjectId() {
      await copyToClipboard(this.projectStore.selectedProject._id);
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
