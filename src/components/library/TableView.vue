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
      separator="none"
      :columns="headers"
      :rows="projects"
      row-key="_id"
      :wrap-cells="true"
      :filter="$refs.actionBar ? $refs.actionBar.searchString : ''"
      :filter-method="searchProject"
      ref="table"
    >
      <template v-slot:header="props">
        <q-tr :props="props">
          <q-th auto-width></q-th>
          <q-th
            v-for="col in props.cols"
            :key="col.name"
            :props="props"
          >
            {{ col.label }}
          </q-th>
        </q-tr>
      </template>
      <template v-slot:body="props">
        <q-tr
          style="cursor: pointer"
          :props="props"
          :class="{
            'bg-primary': props.key == stateStore.selectedProjectId,
          }"
          draggable="true"
          @dragstart="onDragStart(props.key)"
          @dragend="onDragEnd"
        >
          <q-td>
            <q-icon
              v-show="!!props.row.path"
              size="sm"
              :name="props.expand ? 'arrow_drop_down' : 'arrow_right'"
              @click="props.expand = !props.expand"
            />
          </q-td>
          <q-td
            v-for="col in props.cols"
            :key="col.name"
            :props="props"
            @click="clickProject(props.row, props.rowIndex)"
            @dblclick="dblclickProject(props.row)"
            @contextmenu="toggleContextMenu(props.row, props.rowIndex)"
          >
            <div
              v-if="col.name === 'author'"
              style="width: 20em"
              class="ellipsis"
            >
              {{ authorString(col.value) }}
            </div>
            <div
              v-else
              style="width: 40em"
              class="ellipsis"
            >
              {{ col.value }}
            </div>
          </q-td>
          <TableMenu
            :row="props.row"
            @openItem="(row) => dblclickProject(row)"
            @deleteItem="(row) => deleteProject(false)"
            @deleteItemFromDB="(row) => deleteProject(true)"
            @attachFile="(row) => updateProject(row)"
          />
        </q-tr>
        <q-tr
          v-if="props.expand"
          :props="props"
          class="cursor-pointer"
          @dblclick="dblclickProject(props.row)"
        >
          <q-td auto-width></q-td>
          <q-td colspan="100%">
            <q-icon name="bi-file-earmark-pdf" />
            {{ basename(props.row.path) }}
          </q-td>
        </q-tr>
        <q-tr
          v-show="props.expand"
          :props="props"
          class="cursor-pointer"
          v-for="note in notes[props.key]"
          :key="note._id"
          @dblclick="stateStore.openItemId = note._id"
        >
          <q-td auto-width></q-td>
          <q-td colspan="100%">
            <q-icon name="bi-file-earmark-text" />
            {{ note.label }}
          </q-td>
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
import TableMenu from "./TableMenu.vue";

import { copyToClipboard } from "quasar";
import { useStateStore } from "src/stores/appState";
import {
  getProjectsByFolderId,
  deleteProject,
} from "src/backend/project/project";
import { getNotes } from "src/backend/project/note";

export default {
  props: { rightMenuSize: Number },
  emits: ["toggleRightMenu", "dragProject"],

  components: {
    ActionBar,
    TableMenu,
  },

  setup() {
    const stateStore = useStateStore();
    const basename = window.path.basename;
    return { stateStore, basename };
  },

  async mounted() {
    this.projects = await getProjectsByFolderId(
      this.stateStore.selectedFolderId
    );

    for (let project of this.projects) {
      this.notes[project._id] = await getNotes(project._id);
    }
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
      notes: {},

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
    authorString(authors) {
      if (!!!authors?.length) return "";

      let names = [];
      for (let author of authors) {
        if (!!!author) continue;
        if (!!author.literal) names.push(author.literal);
        else names.push(`${author.given} ${author.family}`);
      }
      return names.join(", ");
    },

    /**
     * Add an entry to table
     * @param {Object} project
     */
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
      this.$bus.emit("deleteProject", this.stateStore.selectedProjectId);
    },

    clickProject(row, rowIndex) {
      console.log(row);
      this.stateStore.selectedProjectId = row._id;
      this.selectedProjectIndex = rowIndex;
    },

    dblclickProject(row) {
      this.stateStore.openItemId = row._id;
    },

    toggleContextMenu(row, rowIndex) {
      this.showContextMenu = true;
      this.clickProject(row, rowIndex);
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
            if (prop == "year") row[prop] = row[prop].toString();

            if (prop == "author") row[prop] = authorString(row[prop]);

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
