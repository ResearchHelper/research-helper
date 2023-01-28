<template>
  <div
    :style="`height: ${height}px`"
    id="cy"
    ref="graph"
  ></div>
</template>

<script>
import { getOutEdge, getInEdges } from "src/backend/project/graph";
import { useStateStore } from "src/stores/appState";

import cytoscape from "cytoscape/dist/cytoscape.esm";
import cola from "cytoscape-cola";
cytoscape.use(cola);

export default {
  props: { itemId: String, height: Number },

  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  data() {
    return {
      ready: false,
      nodes: [],
      edges: [],
    };
  },

  watch: {
    async itemId(id) {
      setTimeout(() => {
        this.reload();
      }, 100);
    },
  },

  async mounted() {
    await this.reload();
  },

  methods: {
    async reload() {
      if (!!!this.itemId || this.itemId === "library") return;
      this.ready = false;
      await this.getGraph();
      await this.drawGraph(this.stateStore);
      this.ready = true;
    },

    async getGraph() {
      if (!!!this.itemId || this.itemId == "library") return;

      this.nodes = [];
      this.edges = [];

      let outEdge = await getOutEdge(this.itemId);
      let inEdges = await getInEdges(this.itemId);

      // add source nodes
      let sourceNode = {};
      sourceNode.data = outEdge.sourceNode;
      let type = sourceNode.data.type;
      if (type === "project") sourceNode.data.shape = "rectangle";
      else if (type === "note") sourceNode.data.shape = "ellipse";
      else if (type === undefined) sourceNode.data.shape = "triangle";
      sourceNode.data.bg =
        this.itemId === sourceNode.data.id ? "#1976d2" : "white";
      this.nodes.push(sourceNode);

      for (let inEdge of inEdges) {
        // add back linked nodes
        let node = {};
        node.data = inEdge.sourceNode;
        if (node.data.type === "project") node.data.shape = "rectangle";
        else if (node.data.type === "note") node.data.shape = "ellipse";
        else if (node.data.type === undefined) node.data.shape = "triangle";
        node.data.bg = this.itemId === node.data.id ? "#1976d2" : "white";
        this.nodes.push(node);

        // add in edges
        let edge = {};
        edge.data = {
          source: inEdge.source,
          target: sourceNode.data.id,
        };
        this.edges.push(edge);
      }

      for (let i in outEdge.targetNodes) {
        // add target nodes
        let node = {};
        node.data = outEdge.targetNodes[i];
        if (outEdge.targetNodes[i].type === "project")
          node.data.shape = "rectangle";
        else if (outEdge.targetNodes[i].type === "note")
          node.data.shape = "ellipse";
        else if (outEdge.targetNodes[i].type === undefined)
          node.data.shape = "triangle";
        node.data.bg = this.itemId === node.data.id ? "#1976d2" : "white";
        this.nodes.push(node);

        // add out edges
        let edge = {};
        edge.data = {
          source: outEdge.source,
          target: outEdge.targets[i],
        };
        this.edges.push(edge);
      }
    },

    async drawGraph(stateStore) {
      let cy = cytoscape({
        container: document.getElementById("cy"),

        boxSelectionEnabled: false,

        style: [
          {
            selector: "node",
            style: {
              shape: "data(shape)",
              label: "data(label)",
              color: function (ele) {
                return ele.data("bg");
              },
              "background-color": function (ele) {
                return ele.data("bg");
              },
            },
            css: {
              "text-valign": "top",
              "text-halign": "center",
            },
          },
          {
            selector: "edge",
            css: {
              "target-arrow-shape": "triangle",
              "curve-style": "straight",
            },
          },
        ],

        elements: { nodes: this.nodes, edges: this.edges },

        layout: {
          name: "cola",
          animate: false,
          avoidOverlap: true,
          nodeDimensionsIncludeLabels: true,
        },
      });

      cy.on("tap", "node", function () {
        // MUST use function(){} in order to use this.data
        // this.data is the data of the node
        // we cannot use this to access this.stateStore now
        setTimeout(() => {
          stateStore.openItemId = this.data("id");
        }, 100);
      });
    },
  },
};
</script>
<style scoped>
.square {
  width: 1em;
  height: 1em;
  background: white;
}
.circle {
  width: 1em;
  height: 1em;
  background: white;
  border-radius: 50%;
}
.triangle {
  width: 0;
  height: 0;
  border-left: 0.7em solid transparent;
  border-right: 0.7em solid transparent;
  border-bottom: 1em solid white;
}
</style>
