<template>
  <q-table
    id="projectList"
    class="stickyHeader no-shadow"
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
    :loading="loading"
    selection="multiple"
    v-model:selected="stateStore.selected"
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
            props.key === stateStore.selectedItemId && !isClickingPDF,
          selected: props.selected,
        }"
        draggable="true"
        @dragstart="onDragStart"
        @dragend="onDragEnd"
        @expandRow="(isExpand: boolean) => props.expand=isExpand"
        @click="(e: PointerEvent) => clickProject(props, e)"
        @dblclick="dblclickProject(props.row)"
        @contextmenu="(e:Event) => toggleContextMenu(props, e)"
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
      />
    </template>
  </q-table>
</template>

<script setup lang="ts">
// types
import { computed, nextTick, PropType, ref, toRaw } from "vue";
import { Project, Note, Author } from "src/backend/database";
import { QTable, QTableColumn, QTr } from "quasar";
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
});

const emit = defineEmits(["dragProject", "update:projects"]);

let storedSelectedRow = {};
const isClickingPDF = ref(false);
const showExpansion = ref(false);
const expansionText = ref<string[]>([]);
const loading = ref(false); // is table filtering data
const tableRef = ref();
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
      const tableRows = tableRef.value.filteredSortedRows;
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
      const selectedRows = stateStore.selected.map(toRaw);

      stateStore.selected =
        added === true
          ? selectedRows.concat(
              rangeRows.filter(
                (row: Project) => selectedRows.includes(row) === false
              )
            )
          : selectedRows.filter((row) => rangeRows.includes(row) === false);
    } else if (ctrlKey !== true && added === true) {
      stateStore.selected = [newSelectedRow];
    }
  });
}

/**
 * Convert array of author objects to string
 * @param authors
 */
function authorString(authors: Author[] | undefined) {
  if (!!!authors?.length) return "";

  let names = [];
  for (let author of authors) {
    if (!!!author) continue;
    if (!!author.literal) names.push(author.literal);
    else names.push(`${author.given} ${author.family}`);
  }
  return names.join(", ");
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
  // row: Project, rowIndex: number
  let row = props.row;
  let descriptor = Object.getOwnPropertyDescriptor(props, "selected");
  if (descriptor)
    (descriptor.set as (adding: boolean, e: Event) => void)(true, e);

  console.log(row);
  stateStore.selectedItemId = row._id;
  // ditinguish clicking project row or pdf row
  isClickingPDF.value = false;
  console.log(stateStore.selected);
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

function toggleContextMenu(props: { selected: boolean }, e: Event) {
  if (props.selected) return;
  let descriptor = Object.getOwnPropertyDescriptor(props, "selected");
  if (descriptor)
    (descriptor.set as (adding: boolean, e: Event) => void)(true, e);
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
    JSON.stringify(stateStore.selected)
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
    let authors = authorString(row.author);
    if (authors.search(re) != -1) {
      text = authors.replace(re, `<span class="bg-primary">${terms}</span>`);
      expansionText.value.push(`Authors: ${text}`);
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
