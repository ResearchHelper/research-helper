<template>
  <q-tree
    v-if="!!pdfState.outline"
    dense
    no-connectors
    default-expand-all
    no-selection-unset
    selected-color="primary"
    :nodes="pdfState.outline"
    node-key="label"
    v-model:selected="selected"
    @update:selected="clickTOC"
    ref="tree"
  >
    <template v-slot:default-header="prop">
      <div class="ellipsis">{{ prop.node.label }}</div>
    </template>
  </q-tree>
</template>

<script>
import { usePDFStateStore } from "src/stores/pdfState";

export default {
  setup() {
    const pdfState = usePDFStateStore();
    return { pdfState };
  },

  data() {
    return {
      selected: null,
    };
  },

  methods: {
    clickTOC(nodeKey) {
      let node = this.$refs.tree.getNodeByKey(nodeKey);
      this.pdfState.selectedOutlineNode = node;
    },
  },
};
</script>
