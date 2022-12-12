<template>
  <div
    style="height: calc(100vh - 32px)"
    id="cy"
  ></div>
</template>

<script>
import cytoscape from "cytoscape/dist/cytoscape.esm";
import { getAllNotes } from "src/backend/project/note";
import { getAllProjects } from "src/backend/project/project";
import { useStateStore } from "src/stores/appState";

export default {
  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  data() {
    return {
      nodes: [],
      edges: [],
    };
  },

  async mounted() {
    await this.getGraph();
    var cy = cytoscape({
      container: document.getElementById("cy"),

      boxSelectionEnabled: false,

      style: [
        {
          selector: "node",
          style: {
            shape: "data(shape)",
            label: "data(label)",
            color: "white",
          },
          css: {
            "text-valign": "top",
            "text-halign": "center",
          },
        },
        {
          selector: "node:parent",
          css: {
            "text-valign": "top",
            "text-halign": "center",
            "background-opacity": 0.1,
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
        name: "cose",
        animate: false,
        randomize: false,
        padding: 40,
        componentSpacing: 40,
      },
    });

    let stateStore = this.stateStore;
    cy.on("tap", "node", function () {
      // MUST use function(){} in order to use this.data
      // this.data is the data of the node
      // we cannot use this to access this.stateStore now
      let type = this.data("type");
      if (type == "project") {
        stateStore.openProject(this.data("id"));
      } else if (type == "note") {
        stateStore.openProject(this.data("parent"));
        stateStore.workingNoteId = this.data("id");
      }
      stateStore.setCurrentPage("reader");
    });
  },

  methods: {
    async getGraph() {
      let notes = await getAllNotes();
      let projects = await getAllProjects();
      this.nodes = [];
      this.edges = [];
      for (let item of notes.concat(projects)) {
        let node = {};
        let edge = {};
        if (item.dataType == "note") {
          node.data = {
            id: item._id,
            label: item.label,
            parent: item.projectId,
            shape: "ellipse",
            type: "note",
          };

          for (let link of item.links) {
            edge.data = {
              source: item._id,
              target: link,
            };
            this.edges.push(edge);
          }
          this.nodes.push(node);
        } else if (item.dataType == "project") {
          node.data = {
            id: item._id,
            label: item.title,
            shape: "rectangle",
            type: "project",
          };

          for (let link of item.related) {
            edge.data = {
              source: item._id,
              target: link,
            };
            this.edges.push(edge);
          }
          this.nodes.push(node);
        }
      }
    },
  },
};
</script>
