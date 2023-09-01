<template>
  <q-table
    id="projectList"
    class="stickyHeader no-shadow"
    dense
    hide-bottom
    square
    separator="none"
    table-header-style="white-space: nowarp"
    :rows-per-page-options="[0]"
    :columns="headers"
    :rows="projects"
    row-key="_id"
    :filter="searchString"
    :filter-method="(searchProject as any)"
    :loading="loading"
    selection="multiple"
    v-model:selected="projectStore.selected"
    @selection="
      (details) => handleSelection(details.rows as Project[], details.added, details.evt as KeyboardEvent)
    "
    ref="table"
  >
    <template v-slot:header="props">
      <q-tr :props="props">
        <q-th
          auto-width
          style="padding: 0"
        >
          <input
            type="checkbox"
            style="width: 1.1rem; height: 1.1rem"
            v-model="props.selected"
          />
        </q-th>
        <q-th auto-width></q-th>
        <q-th auto-width></q-th>
        <q-th
          v-for="col in (props.cols as Array<{name: string, label:string}>)"
          :key="col.name"
          :props="props"
          style="padding: 0"
        >
          <span class="text-subtitle1 text-bold">{{ col.label }}</span>
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
            projectStore.selected.map((item) => item._id).includes(props.key) &&
            !isClickingPDF,
          selected: props.selected,
        }"
        draggable="true"
        @dragstart="onDragStart"
        @dragend="onDragEnd"
        @expandRow="(isExpand: boolean) => props.expand=isExpand"
        @mousedown="(e: PointerEvent) => clickProject(props, e)"
        @dblclick="dblclickProject(props.row)"
        @contextmenu="(e:PointerEvent) => toggleContextMenu(props, e)"
      />

      <!-- Expanded Rows -->

      <!-- PDF -->
      <TableItemRow
        v-if="props.expand && !!props.row.path"
        :item="props.row"
        :class="{
          'bg-primary':
            projectStore.selected.map((item) => item._id).includes(props.key) &&
            isClickingPDF,
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
          'bg-primary': projectStore.selected
            .map((item) => item._id)
            .includes(note._id),
        }"
      />

      <!-- Matching Rows  -->
      <TableSearchRow
        v-show="!!searchString"
        :class="{
          'bg-primary': projectStore.selected
            .map((item) => item._id)
            .includes(props.key),
        }"
        :width="searchRowWidth"
        :text="expansionText[props.rowIndex]"
      />
    </template>
  </q-table>
</template>

<script setup lang="ts">
// types
import { nextTick, onMounted, PropType, ref, toRaw } from "vue";
import { Project, Note, Author } from "src/backend/database";
import { QTable, QTableColumn, QTr } from "quasar";
// components
import TableItemRow from "./TableItemRow.vue";
import TableSearchRow from "./TableSearchRow.vue";
import TableProjectRow from "./TableProjectRow.vue";
// db
import { useStateStore } from "src/stores/appState";
import { useProjectStore } from "src/stores/projectStore";
const stateStore = useStateStore();
const projectStore = useProjectStore();
// utils
import { useI18n } from "vue-i18n";
import { authorToString } from "src/backend/project/utils";
const { t } = useI18n({ useScope: "global" });

const props = defineProps({
  searchString: { type: String, required: true },
  projects: { type: Array as PropType<Project[]>, required: true },
});

const emit = defineEmits(["dragProject", "update:projects"]);

let storedSelectedRow = {};
const isClickingPDF = ref(false);
const showExpansion = ref(false);
const expansionText = ref<string[]>([]);
const loading = ref(false); // is table filtering data
const table = ref();
const searchRowWidth = ref(0);
const headers = [
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

onMounted(() => {
  searchRowWidth.value = table.value.$el.getBoundingClientRect().width * 0.8;
});

function handleSelection(rows: Project[], added: boolean, evt: KeyboardEvent) {
  // ignore selection change from header of not from a direct click event
  if (rows.length !== 1 || evt === void 0) {
    return;
  }

  const oldSelectedRow = storedSelectedRow;
  const [newSelectedRow] = rows;
  const { ctrlKey, shiftKey } = evt;

  if (shiftKey !== true) {
    storedSelectedRow = newSelectedRow;
  }

  // wait for the default selection to be performed
  nextTick(() => {
    if (shiftKey === true) {
      const tableRows = table.value.filteredSortedRows;
      let firstIndex = tableRows.indexOf(oldSelectedRow);
      let lastIndex = tableRows.indexOf(newSelectedRow);

      if (firstIndex < 0) {
        firstIndex = 0;
      }

      if (firstIndex > lastIndex) {
        [firstIndex, lastIndex] = [lastIndex, firstIndex];
      }

      const rangeRows = tableRows.slice(firstIndex, lastIndex + 1);
      // we need the original row object so we can match them against the rows in range
      const selectedRows = projectStore.selected.map(toRaw);

      projectStore.selected =
        added === true
          ? selectedRows.concat(
              rangeRows.filter(
                (row: Project) => selectedRows.includes(row) === false
              )
            )
          : selectedRows.filter((row) => rangeRows.includes(row) === false);
    } else if (ctrlKey !== true && added === true) {
      projectStore.selected = [newSelectedRow];
    }
  });
}

/**
 * Select a row in the table
 * @param row
 * @param rowIndex
 */
function clickProject(
  props: {
    row: Project;
    rowIndex: number;
    selected: boolean;
  },
  e: PointerEvent
) {
  if (e.button !== 0) return; // return if not left click
  // row: Project, rowIndex: number
  let row = props.row;
  let descriptor = Object.getOwnPropertyDescriptor(props, "selected");
  if (descriptor)
    (descriptor.set as (adding: boolean, e: Event) => void)(true, e);

  console.log(row);
  // ditinguish clicking project row or pdf row
  isClickingPDF.value = false;
}

/**
 * Double-click a row in the table
 * @param row
 */
function dblclickProject(row: Project) {
  let id = row._id;
  let label = row.label;
  let type = "ReaderPage";
  stateStore.openPage({ id, type, label });
}

function toggleContextMenu(
  props: { selected: boolean; row: Project },
  e: PointerEvent
) {
  // change nothing when right clicked on selected item
  if (props.selected) return;

  // only change the selected items when user right click on a not selected item
  if (
    !projectStore.selected.map((project) => project._id).includes(props.row._id)
  )
    projectStore.selected = [props.row];
}

/**
 * Drag event starts and set draggingProject
 * @param projectId
 */
function onDragStart(e: DragEvent) {
  let rows = document.querySelectorAll("tr.selected");
  let div = document.createElement("div");
  div.id = "drag-group";
  div.style.position = "absolute";
  div.style.top = "-1000px"; // make this invisible
  document.body.append(div);
  for (let row of rows) {
    let clone = row.cloneNode(true) as HTMLElement;
    clone.classList.add("bg-primary");
    div.append(clone);
  }
  e.dataTransfer?.setDragImage(div, 0, 0);
  e.dataTransfer?.setData(
    "draggedProjects",
    JSON.stringify(projectStore.selected)
  );
}

/**
 * Drag event ends and set draggingProjectId to ""
 */
function onDragEnd() {
  document.getElementById("drag-group")?.remove();
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
  loading.value = true;
  expansionText.value = [];
  let text = "";
  let re = RegExp(terms, "i"); // case insensitive
  let filtered = rows.filter((row) => {
    // search in the following props
    for (let prop of [
      "type",
      "title",
      "abstract",
      "DOI",
      "publisher",
      "container-title",
      "path",
      "citation-key",
    ]) {
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
    let authors = authorToString(row.author);
    if (authors.search(re) != -1) {
      text = authors.replace(re, `<span class="bg-primary">${terms}</span>`);
      expansionText.value.push(`Authors: ${text}`);
      return true;
    }

    // search issued year
    let date = row.issued?.["date-parts"];
    if (date) {
      text = date[0][0]
        .toString()
        .replace(re, `<span class="bg-primary">${terms}</span>`);
      expansionText.value.push(`Year: ${text}`);
      return true;
    }

    // search notes
    if (row.children) {
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
    }

    return false;
  });
  showExpansion.value = true;
  loading.value = false;
  return filtered;
}
</script>

<style lang="scss">
.stickyHeader {
  /* height or max-height is important */
  height: 20px;

  .q-table__top,
  .q-table__bottom,
  thead tr:first-child th {
    /* bg color is important for th; just specify one */
    background-color: var(--color-library-tableview-header-bkgd);
  }

  thead tr th {
    position: sticky;
    z-index: 1;
  }
  thead tr:first-child th {
    top: 0;
  }
}

.tableview-row {
  background: var(--color-library-tableview-row-bkgd);
}

#projectList td {
  padding: 0;
}
</style>
