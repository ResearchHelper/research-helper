<template>
  <q-tr>
    <q-th auto-width>
      <input
        type="checkbox"
        class="q-mt-xs"
        style="width: 0.9rem; height: 0.9rem"
        v-model="tableProps.selected"
        @mousedown.stop
      />
    </q-th>
    <q-td auto-width>
      <q-icon
        v-if="!!tableProps.row.path || (tableProps.row.children?.length as typeof NaN) > 0"
        size="sm"
        :name="tableProps.expand ? 'arrow_drop_down' : 'arrow_right'"
        @click="expandRow(!tableProps.expand)"
      />
    </q-td>
    <q-td
      v-for="col in tableProps.cols"
      :key="col.name"
      :props="tableProps"
    >
      <div
        v-if="col.name === 'author'"
        style="font-size: 1rem"
        class="ellipsis"
      >
        {{ shortAuthorString(col.value as Author[]) }}
      </div>
      <div
        v-else
        style="font-size: 1rem; width: 50vw"
        class="ellipsis"
      >
        {{ col.value }}
      </div>
    </q-td>

    <TableProjectMenu @expandRow="expandRow" />
  </q-tr>
</template>

<script setup lang="ts">
import { PropType } from "vue";
import { Project, Author } from "src/backend/database";
import TableProjectMenu from "./TableProjectMenu.vue";

const props = defineProps({
  tableProps: {
    type: Object as PropType<{
      key: string;
      row: Project;
      cols: { name: string; value: string | Author[] }[];
      rowIndex: number;
      expand: boolean;
      selected: boolean;
    }>,
    required: true,
  },
});
const emit = defineEmits(["expandRow"]);

function expandRow(isExpand: boolean) {
  emit("expandRow", isExpand);
}

function shortAuthorString(authors: Author[]) {
  if (authors === undefined) return;

  if (authors.length === 0) return "";
  else if (authors.length === 1) {
    let author = authors[0];
    if (author.literal) return author.literal;
    else return author.family;
  } else if (authors.length === 2) {
    let surnames = [];
    for (let i = 0; i < 2; i++) {
      if (authors[0].literal) surnames.push(authors[0].literal);
      else surnames.push(authors[0].family);
    }
    return surnames.join(" and ");
  } else {
    let author = authors[0];
    if (author.literal) return author.literal;
    else return `${author.family} et al.`;
  }
}
</script>
