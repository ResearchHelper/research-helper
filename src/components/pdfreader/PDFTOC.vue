<template>
  <q-tree
    v-if="!!outline"
    dense
    no-connectors
    default-expand-all
    no-selection-unset
    selected-color="primary"
    no-nodes-label="No outline is available"
    :nodes="outline"
    node-key="label"
    v-model:selected="selected"
    @update:selected="clickTOC"
    ref="tree"
  >
    <template v-slot:default-header="prop">
      <div
        style="font-size: 1rem"
        class="ellipsis"
      >
        {{ prop.node.label }}
      </div>
    </template>
  </q-tree>
</template>

<script setup lang="ts">
import { onMounted, PropType, ref } from "vue";
import { TOCNode } from "src/backend/database";
import { QTree } from "quasar";

const props = defineProps({
  outline: { type: Object as PropType<TOCNode[]>, required: true },
});
const emit = defineEmits(["clickTOC"]);
const selected = ref(null);
const tree = ref(null);
const clickTOC = (nodeKey: string) => {
  if (tree.value === null) return;
  let node = (tree.value as QTree).getNodeByKey(nodeKey);
  emit("clickTOC", node);
};
</script>
