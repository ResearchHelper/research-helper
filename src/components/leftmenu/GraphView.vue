<template>
  <q-spinner-ios
    v-show="!ready && !specialPages.includes(itemId)"
    color="primary"
    size="md"
  />
  <div class="q-mx-xl q-my-sm row justify-between">
    <div class="row items-center">
      <div class="square"></div>
      <div
        class="q-ml-xs"
        style="font-size: 1rem"
      >
        {{ $t("project") }}
      </div>
    </div>
    <div class="row items-center">
      <div class="circle"></div>
      <div
        class="q-ml-xs"
        style="font-size: 1rem"
      >
        {{ $t("note") }}
      </div>
    </div>
    <div class="row items-center">
      <div class="triangle"></div>
      <div
        class="q-ml-xs"
        style="font-size: 1rem"
      >
        {{ $t("missing") }}
      </div>
    </div>
  </div>
  <div
    :style="`height: ${height}px`"
    id="cy"
    ref="graph"
  ></div>
</template>

<script setup lang="ts">
// types
import { onMounted, ref, watch } from "vue";
import { Edge, Node } from "src/backend/database";
// db
import { getOutEdge, getInEdges } from "src/backend/project/graph";
import { useStateStore } from "src/stores/appState";
// cytoscape
import cytoscape from "cytoscape";
import cola from "cytoscape-cola";
cytoscape.use(cola);

interface NodeUI {
  data: Node & { bg?: string; shape?: string };
}

interface EdgeUI {
  data: { source: string; target: string };
}

const props = defineProps({
  itemId: { type: String, required: true },
  height: { type: Number, required: true },
});

const stateStore = useStateStore();

const ready = ref(false);
const specialPages = ref(["library", "settings"]);
const nodes = ref<NodeUI[]>([]);
const edges = ref<EdgeUI[]>([]);

watch(
  () => props.itemId,
  () => {
    setTimeout(() => {
      reload();
    }, 100);
  }
);

onMounted(async () => {
  await reload();
});

async function reload() {
  if (!!!props.itemId || specialPages.value.includes(props.itemId)) return;
  ready.value = false;
  await getGraph();
  await drawGraph();
  ready.value = true;
}

async function getGraph() {
  // get background color
  let color = getComputedStyle(document.body).getPropertyValue("--color-text");

  nodes.value = [];
  edges.value = [];

  let outEdge = (await getOutEdge(props.itemId)) as Edge;
  let inEdges = (await getInEdges(props.itemId)) as Edge[];

  // add source nodes
  let sourceNode = {} as NodeUI;
  sourceNode.data = outEdge.sourceNode;
  let type = sourceNode.data.type;
  if (type === "project") sourceNode.data.shape = "rectangle";
  else if (type === "note") sourceNode.data.shape = "ellipse";
  else if (type === undefined) sourceNode.data.shape = "triangle";
  sourceNode.data.bg = props.itemId === sourceNode.data.id ? "#1976d2" : color;
  nodes.value.push(sourceNode);

  for (let inEdge of inEdges) {
    // add back linked nodes
    let node = {} as NodeUI;
    node.data = inEdge.sourceNode;
    if (node.data.type === "project") node.data.shape = "rectangle";
    else if (node.data.type === "note") node.data.shape = "ellipse";
    else if (node.data.type === undefined) node.data.shape = "triangle";
    node.data.bg = props.itemId === node.data.id ? "#1976d2" : color;
    nodes.value.push(node);

    // add in edges
    let edge = {} as EdgeUI;
    edge.data = {
      source: inEdge.source,
      target: sourceNode.data.id,
    };
    edges.value.push(edge);
  }

  for (let i in outEdge.targetNodes) {
    // add target nodes
    let node = {} as NodeUI;
    node.data = outEdge.targetNodes[i];
    if (outEdge.targetNodes[i].type === "project")
      node.data.shape = "rectangle";
    else if (outEdge.targetNodes[i].type === "note")
      node.data.shape = "ellipse";
    else if (outEdge.targetNodes[i].type === undefined)
      node.data.shape = "triangle";

    node.data.bg = props.itemId === node.data.id ? "#1976d2" : color;
    nodes.value.push(node);

    // add out edges
    let edge = {} as EdgeUI;
    edge.data = {
      source: outEdge.source,
      target: outEdge.targets[i],
    };
    edges.value.push(edge);
  }
}

async function drawGraph() {
  let cy = cytoscape({
    container: document.getElementById("cy"),

    boxSelectionEnabled: false,

    style: [
      {
        selector: "node",
        style: {
          shape: "data(shape)",
          label: "data(label)",
          "text-wrap": "ellipsis",
          "text-max-width": "15em",
          color: function (el: cytoscape.NodeSingular) {
            return el.data("bg");
          },
          "background-color": function (el) {
            return el.data("bg");
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
    ] as cytoscape.Stylesheet[],

    elements: { nodes: nodes.value, edges: edges.value },

    layout: {
      name: "cola" as any, // cytoscape's type is not good
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
}
</script>
<style scoped>
.square {
  width: 1rem;
  height: 1rem;
  background: var(--color-text);
}
.circle {
  width: 1rem;
  height: 1rem;
  background: var(--color-text);
  border-radius: 50%;
}
.triangle {
  width: 0;
  height: 0;
  border-left: 0.6rem solid transparent;
  border-right: 0.6rem solid transparent;
  border-bottom: 1rem solid var(--color-text);
}
</style>
