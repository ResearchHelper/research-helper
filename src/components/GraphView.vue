<template>
  <q-spinner-ios
    v-show="!ready"
    color="primary"
    size="md"
  />
  <div
    style="height: 100vh"
    id="cy"
    ref="graph"
  ></div>
</template>

<script>
import { getAllNotes, getNote, getNotes } from "src/backend/project/note";
import { getAllProjects, getProject } from "src/backend/project/project";
import { useStateStore } from "src/stores/appState";

import cytoscape from "cytoscape/dist/cytoscape.esm";
import cola from "cytoscape-cola";
cytoscape.use(cola);

export default {
  props: { itemId: String },

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
      if (!!!id) return;
      await this.getGraph();
      await this.drawGraph(this.stateStore);
    },
  },

  async mounted() {
    if (!!!this.itemId) return;

    await this.getGraph();
    await this.drawGraph(this.stateStore);
    setTimeout(() => {
      this.ready = true;
    }, 100);
  },

  methods: {
    async getGraph() {
      let notes = [];
      let projects = [];

      if (!!!this.itemId || this.itemId == "library") {
        notes = await getAllNotes();
        projects = await getAllProjects();
      } else {
        let item = await getNote(this.itemId);
        let projectId = "";
        if (item.dataType == "project") {
          projectId = item._id;
        } else if (item.dataType == "note") {
          projectId = item.projectId;
        }
        // get projects and its notes
        projects.push(await getProject(projectId));
        notes = await getNotes(projectId);
        let n = notes.length;
        // get related projects and their notes
        for (let relatedId of projects[0].related) {
          projects.push(await getProject(relatedId));
          let otherNotes = await getNotes(relatedId);
          notes = notes.concat(otherNotes);
        }
        // get linked projects/notes in the notes of current project
        for (let note of notes.slice(0, n)) {
          for (let link of note.links) {
            let item = await getProject(link);
            if (item.dataType === "project") projects.push(item);
            else if (item.dataType === "note") notes.push(item);
          }
        }
      }

      this.nodes = [];
      this.edges = [];
      for (let item of notes.concat(projects)) {
        let node = {};
        if (item.dataType == "note") {
          node.data = {
            id: item._id,
            label: item.label,
            parent: item.projectId,
            shape: "ellipse",
            type: "note",
            bg: this.itemId == item._id ? "#1976d2" : "white",
          };

          for (let link of item.links) {
            let edge = {};
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
            bg: this.itemId == item._id ? "#1976d2" : "white",
          };

          for (let link of item.related) {
            let edge = {};
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

    async drawGraph(stateStore) {
      const cy = cytoscape({
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
            selector: "node:parent",
            css: {
              "text-valign": "top",
              "text-halign": "center",
              "background-opacity": 0.1,
              "background-color": function (ele) {
                return ele.data("bg");
              },
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
