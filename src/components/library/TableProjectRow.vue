<template>
  <q-tr>
    <q-td auto-width>
      <q-icon
        v-if="!!props.row.path || (props.row.children?.length as typeof NaN) > 0"
        size="sm"
        :name="props.expand ? 'arrow_drop_down' : 'arrow_right'"
        @click="expandRow(!props.expand)"
      />
    </q-td>
    <q-td
      v-for="col in props.cols"
      :key="col.name"
      :props="props"
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
      :rowIndex="props.rowIndex"
      @expandRow="expandRow"
    />
  </q-tr>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { Project, Author } from "src/backend/database";
import TableProjectMenu from "./TableProjectMenu.vue";
import { useStateStore } from "src/stores/appState";

export default defineComponent({
  props: {
    props: {
      type: Object as PropType<{
        key: string;
        row: Project;
        cols: any;
        rowIndex: number;
        expand: boolean;
      }>,
      required: true,
    },
  },

  emits: ["expandRow"],

  components: { TableProjectMenu },

  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  methods: {
    expandRow(isExpand: boolean) {
      this.$emit("expandRow", isExpand);
    },

    authorString(authors: Author[]) {
      if (!!!authors?.length) return "";

      let names = [];
      for (let author of authors) {
        if (!!!author) continue;
        if (!!author.literal) names.push(author.literal);
        else names.push(`${author.given} ${author.family}`);
      }
      return names.join(", ");
    },
  },
});
</script>
