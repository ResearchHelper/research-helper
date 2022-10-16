<template>
  <q-tree
    :nodes="outline"
    node-key="label"
    no-connectors
    default-expand-all
    v-model:selected="selected"
    @update:selected="clickTOC"
    ref="tree"
  />
</template>

<script>
import { useStateStore } from "src/stores/appState";

export default {
  props: ["pdfDocument"],

  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  data() {
    return {
      outline: [],
      selected: null,
      currentPageNumber: 1,
    };
  },

  watch: {
    pdfDocument(pdf) {
      this.getTOC();
    },
  },

  mounted() {
    this.getTOC();
  },

  methods: {
    getTOC() {
      if (!!this.pdfDocument == false) return;
      function _dfs(oldNode) {
        var tree = [];
        for (var k in oldNode) {
          let node = {
            label: oldNode[k].title,
            children: _dfs(oldNode[k].items),
          };
          if (typeof oldNode[k].dest === "string") node.dest = oldNode[k].dest;
          else node.ref = oldNode[k].dest[0];
          tree.push(node);
        }
        return tree;
      }

      this.pdfDocument.getOutline().then((outline) => {
        this.outline = _dfs(outline);
      });
    },

    async clickTOC(nodeKey) {
      let node = this.$refs.tree.getNodeByKey(nodeKey);
      if (node.ref === undefined) {
        this.pdfDocument.getDestination(node.dest).then((dest) => {
          let ref = dest[0];
          this.pdfDocument.getPageIndex(ref).then((pageIndex) => {
            this.$emit("clickTOC", pageIndex + 1);
          });
        });
      } else {
        this.pdfDocument.getPageIndex(node.ref).then((pageIndex) => {
          this.$emit("clickTOC", pageIndex + 1);
        });
      }
    },
  },
};
</script>
