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

<script>
export default {
  props: { outline: Array },

  data() {
    return {
      selected: null,
    };
  },

  methods: {
    clickTOC(nodeKey) {
      let node = this.$refs.tree.getNodeByKey(nodeKey);
      this.$emit("clickTOC", node);
    },
  },
};
</script>
