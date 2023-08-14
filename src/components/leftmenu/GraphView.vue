<template>
  <!-- <div v-if="nodes.length == 0">{{ $t("no-related-projects-or-notes") }}</div> -->
  <!-- <div v-else> -->
  <div>
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
  </div>
</template>

<script setup lang="ts">
// types
import { inject, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import {
  NodeUI,
  EdgeUI,
  Note,
  NoteType,
  Project,
  db,
} from "src/backend/database";
// db
import { useStateStore } from "src/stores/appState";
// cytoscape
import cytoscape from "cytoscape";
import cola from "cytoscape-cola";
import { EventBus } from "quasar";
import { getItem, getLinks, getParents } from "src/backend/project/graph";
import { getNotes } from "src/backend/project/note";
cytoscape.use(cola);

const props = defineProps({
  itemId: { type: String, required: true },
  height: { type: Number, required: true },
});

const stateStore = useStateStore();
const bus = inject("bus") as EventBus;

const specialPages = ref(["library", "settings"]);

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
  bus.on("updateGraph", reload);
});

onBeforeUnmount(() => {
  bus.off("updateGraph", reload);
});

async function reload() {
  if (!!!props.itemId || specialPages.value.includes(props.itemId)) return;
  let elements = await getGraph();
  await drawGraph(elements);
}

/**
 * Note centered local graph
 */
async function getGraph() {
  let elements = { nodes: [] as NodeUI[], edges: [] as EdgeUI[] };
  let item = await getItem(props.itemId);
  if (!item) return elements;

  // if the item is project, also its notes' links and their parents
  if (item.dataType === "project") {
    let notes = await getNotes(item._id);
    for (let note of notes) {
      let { nodes, edges } = await getLinks(note);
      nodes = nodes.concat(nodes, await getParents(nodes));
      elements.nodes = elements.nodes.concat(nodes);
      elements.edges = elements.edges.concat(edges);
    }
  }
  // get the links and parents of the item itself
  let { nodes, edges } = await getLinks(item);
  nodes = nodes.concat(nodes, await getParents(nodes));
  elements.nodes = elements.nodes.concat(nodes);
  elements.edges = elements.edges.concat(edges);

  // set styles to nodes
  let color = getComputedStyle(document.body).getPropertyValue("--color-text");
  for (let node of elements.nodes) {
    let type = node.data.type;
    if (type === "project") node.data.shape = "rectangle";
    else if (type === "note") node.data.shape = "ellipse";
    else if (type === undefined) node.data.shape = "triangle";
    node.data.bg = props.itemId === node.data.id ? "#1976d2" : color;
  }

  return elements;
}

async function drawGraph(elements: { nodes: NodeUI[]; edges: EdgeUI[] }) {
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
        selector: ":parent",
        css: {
          "background-color": "grey",
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

    elements: elements,

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
    let id = this.data("id") as string;
    let label = this.data("label") as string;
    let type = "";
    db.get(id).then((item) => {
      if ((item as Project | Note).dataType === "project") {
        type = "ReaderPage";
      } else if ((item as Project | Note).dataType === "note") {
        if ((item as Note).type === NoteType.EXCALIDRAW)
          type = "ExcalidrawPage";
        else type = "NotePage";
      }
      stateStore.openPage({ id, type, label });
    });
  });
}

defineExpose({
  reload,
});
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
