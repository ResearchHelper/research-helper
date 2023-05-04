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
    :rows="projects"
    row-key="_id"
    :wrap-cells="true"
    :filter="searchString"
    :filter-method="(searchProject as any)"
    ref="table"
  >
    <template v-slot:header="props">
      <q-tr :props="props">
        <q-th auto-width></q-th>
        <q-th
          v-for="col in (props.cols as Array<{name: string, label:string}>)"
          :key="col.name"
          :props="props"
        >
          <div class="text-subtitle1 text-bold">{{ col.label }}</div>
        </q-th>
      </q-tr>
    </template>
    <template v-slot:body="props">
      <!-- ProjectRow -->
      <TableProjectRow
        :tableProps="props"
        no-hover
        style="cursor: pointer"
        class="tableview-row"
        :class="{
          'bg-primary':
            props.key === stateStore.selectedItemId && !isClickingPDF,
        }"
        draggable="true"
        @dragstart="onDragStart(props.key)"
        @dragend="onDragEnd"
        @expandRow="(isExpand: boolean) => props.expand=isExpand"
        @click="clickProject(props.row, props.rowIndex)"
        @dblclick="dblclickProject(props.row)"
        @contextmenu="toggleContextMenu(props.row, props.rowIndex)"
        ref="projectRow"
      ></TableProjectRow>

      <!-- Expanded Rows -->

      <!-- PDF -->
      <TableItemRow
        v-if="props.expand && !!props.row.path"
        :item="props.row"
        :class="{
          'bg-primary':
            props.key === stateStore.selectedItemId && isClickingPDF,
        }"
        @click="isClickingPDF = true"
      />
      <!-- Notes -->
      <TableItemRow
        v-show="props.expand"
        v-for="note in (props.row.children as Note[])"
        :key="note._id"
        :item="note"
        :class="{
          'bg-primary': note._id === stateStore.selectedItemId,
        }"
      />

      <!-- Matching Rows  -->
      <TableSearchRow
        v-show="!!searchString"
        :class="{
          'bg-primary': props.key === stateStore.selectedItemId,
        }"
        :width="($refs.table as QTable).$el.getBoundingClientRect().width * 0.8"
        :text="expansionText[props.rowIndex]"
      ></TableSearchRow>
    </template>
  </q-table>
</template>

<script setup lang="ts">
// types
import { computed, PropType, ref } from "vue";
import { Project, Note } from "src/backend/database";
import { QTable, QTableColumn } from "quasar";
// components
import TableItemRow from "./TableItemRow.vue";
import TableSearchRow from "./TableSearchRow.vue";
import TableProjectRow from "./TableProjectRow.vue";
// db
import { useStateStore } from "src/stores/appState";
// utils
import { useI18n } from "vue-i18n";
const stateStore = useStateStore();
const { t } = useI18n({ useScope: "global" });

const props = defineProps({
  searchString: { type: String, required: true },
  projects: { type: Array as PropType<Project[]>, required: true },
  selectedProject: { type: Object as PropType<Project>, required: false },
});

const emit = defineEmits([
  "dragProject",
  "update:projects",
  "update:selectedProject",
]);

const projectRow = ref<typeof TableProjectRow | null>(null);
const isClickingPDF = ref(false);
const showExpansion = ref(false);
const expansionText = ref<string[]>([]);

const headers = computed(() => {
  return [
    {
      name: "title",
      field: "title",
      label: t("title"),
      align: "left",
      sortable: true,
    },
    {
      name: "author",
      field: "author",
      label: t("author"),
      align: "left",
      sortable: true,
    },
  ] as QTableColumn[];
});

/**
 * Select a row in the table
 * @param row
 * @param rowIndex
 */
function clickProject(row: Project, rowIndex: number) {
  console.log(row);
  stateStore.selectedItemId = row._id;
  // ditinguish clicking project row or pdf row
  isClickingPDF.value = false;
  emit("update:selectedProject", row);
}

/**
 * Double-click a row in the table
 * @param row
 */
function dblclickProject(row: Project) {
  stateStore.openItem(row._id);
}

/**
 * Select the row and show context menu
 * @param row - row to be select
 * @param rowIndex
 */
function toggleContextMenu(row: Project, rowIndex: number) {
  // we must select the row first
  // before using the functionalities in the menu
  clickProject(row, rowIndex);
}

/**
 * Drag event starts and set draggingProject
 * @param projectId
 */
function onDragStart(projectId: string) {
  emit("dragProject", projectId);
}

/**
 * Drag event ends and set draggingProjectId to ""
 */
function onDragEnd() {
  emit("dragProject", "");
}

/**
 * Filter method for the table
 * @param rows - array of projects
 * @param terms - terms to filter with (is essentially the 'filter' prop value)
 * @param cols - array of columns
 * @param getCellValue - optional function to get a cell value
 */
function searchProject(
  rows: Project[],
  terms: string,
  cols: QTableColumn[],
  getCellValue: (col: QTableColumn, row: Project) => any
) {
  expansionText.value = [];
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
        expansionText.value.push(
          `${prop.charAt(0).toUpperCase() + prop.slice(1)}: ${text}`
        );
        return true;
      }
    }

    // search tags
    for (let tag of row.tags) {
      if (tag.search(re) != -1) {
        text = tag.replace(re, `<span class="bg-primary">${terms}</span>`);
        expansionText.value.push("Tag: " + text);
        return true;
      }
    }

    // search authors
    if (projectRow.value) {
      let authors = projectRow.value.authorString(row.author);
      if (authors.search(re) != -1) {
        text = authors.replace(re, `<span class="bg-primary">${terms}</span>`);
        expansionText.value.push(`Authors: ${text}`);
        return true;
      }
    }

    // search notes
    for (let note of row.children as Note[]) {
      if (note.label.search(re) != -1) {
        text = note.label.replace(
          re,
          `<span class="bg-primary">${terms}</span>`
        );
        expansionText.value.push(`Note: ${text}`);
        return true;
      }
    }

    return false;
  });
  showExpansion.value = true;
  return filtered;
}
</script>

<style lang="scss">
.stickyHeader {
  /* height or max-height is important */
  height: 100%;

  .q-table__top,
  .q-table__bottom,
  thead tr:first-child th {
    /* bg color is important for th; just specify one */
    background-color: var(--color-library-tableview-bkgd);
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
