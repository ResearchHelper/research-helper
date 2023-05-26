<template>
  <q-tr>
    <q-th auto-width>
      <input
        type="checkbox"
        class="q-mt-xs"
        v-model="tableProps.selected"
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
        style="font-size: 1rem; width: 20em"
        class="ellipsis"
      >
        {{ authorString(col.value as Author[]) }}
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
      :row="tableProps.row"
      :rowIndex="tableProps.rowIndex"
      @expandRow="expandRow"
    />
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

function authorString(authors: Author[]) {
  if (!!!authors?.length) return "";

  let names = [];
  for (let author of authors) {
    if (!!!author) continue;
    if (!!author.literal) names.push(author.literal);
    else names.push(`${author.given} ${author.family}`);
  }
  return names.join(", ");
}
</script>
