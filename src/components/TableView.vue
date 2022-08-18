<template>
  <q-table
    :columns="headers"
    :rows="projects"
    row-key="title"
    hide-bottom
    :virtual-scroll="true"
    :wrap-cells="true"
    dense
    @row-click="clickRow"
    @row-dbclick="dbclickRow"
  >
    <template v-slot:header="props">
      <q-tr :props="props">
        <q-th auto-width />
        <q-th
          v-for="col in props.cols"
          :key="col.name"
          :props="props"
        >
          {{ col.label }}
        </q-th>
      </q-tr>
    </template>

    <template v-slot:body="props">
      <q-tr :props="props">
        <q-td auto-width>
          <q-btn
            size="sm"
            color="accent"
            round
            dense
            @click="props.expand = !props.expand"
            :icon="props.expand ? 'remove' : 'add'"
          />
        </q-td>
        <q-td
          v-for="col in props.cols"
          :key="col.name"
          :props="props"
        >
          {{ col.value }}
        </q-td>
      </q-tr>
      <q-tr
        v-show="props.expand"
        :props="props"
      >
        <q-td colspan="100%">
          <div class="text-left">
            This is expand slot for row above: {{ props.row.name }}.
          </div>
        </q-td>
      </q-tr>
    </template>
  </q-table>

  {{ stateStore.selectedProject }}
</template>

<script>
import { useStateStore } from "../stores/appState";

export default {
  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  data() {
    return {
      headers: [
        {
          name: "title",
          field: "author",
          label: "Author(s)",
          align: "left",
        },
        {
          name: "year",
          field: "year",
          label: "Year",
          align: "left",
        },
        {
          name: "title",
          field: "title",
          label: "Title",
          align: "left",
        },
      ],

      projects: [],
    };
  },

  mounted() {
    let projectIds = [
      "23da48b7-6792-4132-957b-bc0f8715950c",
      "a0e33bf4-5843-4137-a06d-4e1af823a00f",
    ];

    this.getProjects(projectIds);
  },

  methods: {
    getProjects(projectIds) {
      this.projects = [];
      for (let projectId of projectIds) {
        fetch("http://localhost:5000/project/" + projectId, {
          mode: "cors",
          method: "GET",
        })
          .then((response) => {
            return response.json();
          })
          .then((json) => {
            let info = json.info;
            info.files = json.files;
            info.id = projectId; // must id as key since the expandable row requires it
            this.projects.push(info);
          });
      }
    },

    clickRow(project) {
      this.stateStore.selectedProject = project;

      // // remove background colors for other projects
      // let allElements = document.querySelectorAll("tr");
      // for (let element of allElements) {
      //   element.classList.remove("table-item-clicked");
      // }
      // // color the selected project
      // let selectedElement = document.querySelector("tr:hover");
      // selectedElement.classList.add("table-item-clicked");
    },

    dbclickRow(project) {
      console.log(project);
      this.$root.$emit("openProject", project);
      this.stateStore.openedProjects.push(project);
      this.stateStore.workingProject = project;
    },

    contextMenu(e, project) {
      console.log(project);
      e.srcElement.click();

      this.$nextTick(() => {
        // show context menu if we are selecting a node
        if (this.selectedProject) {
          this.x = e.clientX;
          this.y = e.clientY;
          this.showContextMenu = true;
        }
      });
    },
  },
};
</script>

<style></style>
