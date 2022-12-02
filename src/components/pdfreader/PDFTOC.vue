<template>
  <q-tree
    :nodes="pdfState.outline"
    node-key="label"
    no-connectors
    default-expand-all
    v-model:selected="selected"
    @update:selected="clickTOC"
    ref="tree"
  />
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
