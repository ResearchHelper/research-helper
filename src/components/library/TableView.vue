<template>
  <q-table
    class="stickyHeader no-shadow"
    virtual-scroll
    dense
    hide-bottom
    square
    separator="none"
    :rows-per-page-options="[0]"
    :columns="headers"
    :rows="rows"
    row-key="_id"
    :wrap-cells="true"
    :filter="searchString"
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
          <div class="text-subtitle1 text-bold">{{ col.label }}</div>
        </q-th>
      </q-tr>
    </template>
    <template v-slot:body="props">
      <q-tr
        no-hover
        style="cursor: pointer"
        :props="props"
        class="tableview-row"
        :class="{
          'bg-primary':
            props.key === stateStore.selectedItemId && !isClickingPDF,
        }"
        draggable="true"
        @dragstart="onDragStart(props.key)"
        @dragend="onDragEnd"
      >
        <q-td auto-width>
          <q-icon
            v-if="!!props.row.path || props.row.children?.length > 0"
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
            style="font-size: 1rem; width: 20em"
            class="ellipsis"
          >
            {{ authorString(col.value) }}
          </div>
          <div
            v-else
            style="font-size: 1rem; width: 30rem"
            class="ellipsis"
          >
            {{ col.value }}
          </div>
        </q-td>
        <TableProjectMenu
          :row="props.row"
          @openItem="(row) => dblclickProject(row)"
          @attachFile="props.expand = true"
          @addNote="
            (row) => {
              props.expand = true;
              addNote(row._id);
            }
          "
        />
      </q-tr>

      <!-- PDF -->
      <TableItemRow
        v-if="props.expand && !!props.row.path"
        :item="props.row"
        :class="{
          'bg-primary':
            props.key === stateStore.selectedItemId && isClickingPDF,
        }"
        @click="this.isClickingPDF = true"
        @renameFile="(meta) => renameFromMeta(meta)"
      />
      <!-- Notes -->
      <TableItemRow
        v-show="props.expand"
        v-for="note in props.row.children"
        :key="note._id"
        :item="note"
        :class="{
          'bg-primary': note._id === stateStore.selectedItemId,
        }"
        @renameNote="(note) => renameNote(note)"
        @deleteNote="(note) => deleteNote(note)"
      />

      <q-tr
        v-show="!!searchString"
        :props="props"
        :class="{
          'bg-primary': props.key === stateStore.selectedItemId,
          'tableview-row':
            props.rowIndex % 2 === 0 && props.key !== stateStore.selectedItemId,
        }"
      >
        <q-td colspan="100%">
          <div
            :style="`width: ${
              $refs.table.$el.getBoundingClientRect().width * 0.8
            }px;`"
            class="q-px-lg ellipsis text-grey text-capitalize"
            v-html="expansionText[props.rowIndex]"
          ></div>
        </q-td>
      </q-tr>
    </template>
  </q-table>
</template>

<script>
import TableProjectMenu from "./TableProjectMenu.vue";
import TableItemRow from "./TableItemRow.vue";

import { copyToClipboard } from "quasar";
import { useStateStore } from "src/stores/appState";
import { updateProject } from "src/backend/project/project";
import { addNote, deleteNote, updateNote } from "src/backend/project/note";
import {
  createEdge,
  deleteEdge,
  updateEdge,
  appendEdgeTarget,
  updateEdgeTarget,
  deleteEdgeTarget,
} from "src/backend/project/graph";
import { renameFile } from "src/backend/project/file";

export default {
  props: { searchString: String, projects: Array, selectedProject: Object },
  emits: ["dragProject", "update:projects", "update:selectedProject"],

  components: {
    TableProjectMenu,
    TableItemRow,
  },

  setup() {
    const stateStore = useStateStore();
    const basename = window.path.basename;
    return { stateStore, basename };
  },

  data() {
    return {
      headers: [
        {
          name: "title",
          field: "title",
          label: this.$t("title"),
          align: "left",
        },
        {
          name: "author",
          field: "author",
          label: this.$t("author"),
          align: "left",
        },
      ],
      isClickingPDF: false,

      // for search
      showExpansion: false,
      expansionText: [],
    };
  },

  computed: {
    rows: {
      get() {
        return this.projects;
      },
      set(newRows) {
        this.$emit("update:projects", newRows);
      },
    },

    selectedRow: {
      get() {
        return this.selectedProject;
      },
      set(newRow) {
        this.$emit("update:selectedProject", newRow);
      },
    },
  },

  methods: {
    /*********************************************************
     * Item Row (Add note, delete note, rename note, rename file from meta)
     *********************************************************/

    /**
     * Rename attached file from Metadata
     * @param {Object} - meta infos
     */
    async renameFromMeta(meta) {
      let author = "";
      let year = meta.year || "Unknown";
      let title = meta.title;
      let extname = window.path.extname(meta.path);
      if (meta.author.length === 0) {
        // no author
        author = "Unknown";
      } else {
        // 1 author
        let author0 = meta.author[0];
        author = !!author0.family ? author0.family : author0.literal;

        // more than 1 authors
        if (meta.author.length > 1) author += " et al.";
      }
      let fileName = `${author} - ${year} - ${title}${extname}`;

      // update ui and backend
      meta.path = renameFile(meta.path, fileName);
      meta = await updateProject(meta);
      this.selectedRow._rev = meta._rev;
    },

    /**
     * Add note to a project
     * @param {string} projectId
     */
    async addNote(projectId) {
      // update db
      let note = await addNote(projectId);
      await createEdge(note);
      await appendEdgeTarget(note.projectId, note);

      // update ui
      this.selectedRow.children.push(note);
      this.stateStore.selectedItemId = note._id;

      // update projectTree ui
      this.$bus.emit("updateProject", this.selectedRow);
    },

    /**
     * Delete note from a project
     * @param {Object} note
     */
    async deleteNote(note) {
      // update db
      await deleteNote(note._id);
      await deleteEdge(note._id);
      await deleteEdgeTarget(note.projectId, note._id);

      // update ui
      let row = this.rows.find((p) => p._id == note.projectId);
      row.children = row.children.filter((n) => n._id != note._id);

      // update projectTree ui
      this.$bus.emit("updateProject", row);
    },

    /**
     * Rename a note from table
     * @param {Object} note
     */
    async renameNote(note) {
      // update db
      await updateNote(note._id, { label: note.label });
      let sourceNode = {
        id: note._id,
        label: note.label,
        type: note.dataType,
      };
      await updateEdge(note._id, { sourceNode: sourceNode });
      await updateEdgeTarget(note.projectId, note);

      // update ui
      let row = this.rows.find((p) => p._id == note.projectId);
      this.$bus.emit("updateProject", row); // to update ui of projectTree
    },

    /**
     * Table UI (click, double-click, context menu, author string, copyID, filter method)
     */

    /**
     * Select a row in the table
     * @param {Object} row
     * @param {number} rowIndex
     */
    clickProject(row, rowIndex) {
      console.log(row);
      this.stateStore.selectedItemId = row._id;

      // ditinguish clicking project row or pdf row
      this.isClickingPDF = false;
      this.$emit("update:selectedProject", row);
    },

    /**
     * Double-click a row in the table
     * @param {Object} row
     */
    dblclickProject(row) {
      this.stateStore.openItemId = row._id;
    },

    /**
     * Select the row and show context menu
     * @param {Object} row
     * @param {number} rowIndex
     */
    toggleContextMenu(row, rowIndex) {
      this.showContextMenu = true;
      this.clickProject(row, rowIndex);
    },

    /**
     * Copy the project ID
     */
    async copyProjectId() {
      await copyToClipboard(this.stateStore.selectedItemId);
    },

    /**
     * Filter method for the table
     * @param {Array} rows - array of projects
     * @param {String | Object} terms - terms to filter with (is essentially the 'filter' prop value)
     * @param {Array} cols - array of columns
     * @param {Function} getCellValue - optional function to get a cell value
     */
    searchProject(rows, terms, cols, getCellValue) {
      this.expansionText = [];
      let text = "";
      let re = RegExp(terms, "i"); // case insensitive
      let filtered = rows.filter((row) => {
        // search title, abstract, and year
        for (let prop of ["title", "abstract", "DOI", "publisher"]) {
          if (row[prop] === undefined) continue;
          if (row[prop].search(re) != -1) {
            text = row[prop].replace(
              re,
              `<span class="bg-primary">${terms}</span>`
            );
            this.expansionText.push(`${prop}: ${text}`);
            return true;
          }
        }

        // search tags
        for (let tag of row.tags) {
          if (tag.search(re) != -1) {
            text = tag.replace(re, `<span class="bg-primary">${terms}</span>`);
            this.expansionText.push("tag: " + text);
            return true;
          }
        }

        // search authors
        let authors = this.authorString(row.author);
        if (authors.search(re) != -1) {
          text = authors.replace(
            re,
            `<span class="bg-primary">${terms}</span>`
          );
          this.expansionText.push(`authors: ${text}`);
          return true;
        }

        // search notes
        for (let note of row.children) {
          if (note.label.search(re) != -1) {
            text = note.label.replace(
              re,
              `<span class="bg-primary">${terms}</span>`
            );
            this.expansionText.push(`note: ${text}`);
            return true;
          }
        }

        return false;
      });
      this.showExpansion = true;
      return filtered;
    },

    /**
     * Convert array of author objects to string
     * authors = [{family: "Feng", given: "Hunt"}, {literal: "Hunt Feng"}, ...]
     * @param {Array} authors
     */
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

    /**********************************************************
     * Drag and Drop
     **********************************************************/

    /**
     * Drag event starts and set draggingProject
     * @param {string} projectId
     */
    onDragStart(projectId) {
      this.$emit("dragProject", projectId);
    },

    /**
     * Drag event ends and set draggingProjectId to ""
     */
    onDragEnd() {
      this.$emit("dragProject", "");
    },
  },
};
</script>

<style lang="scss">
.stickyHeader {
  /* height or max-height is important */
  height: 100%;

  .q-table__top,
  .q-table__bottom,
  thead tr:first-child th {
    /* bg color is important for th; just specify one */
    background-color: transparent;
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

.tableview-row {
  background: var(--color-library-tableview-row-bkgd);
}
</style>
