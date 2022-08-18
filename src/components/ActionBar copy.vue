<template>
  <v-toolbar dense>
    <v-menu offset-y>
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          icon
          v-bind="attrs"
          v-on="on"
        >
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item @click="addProject('paper')"> Add From Paper </v-list-item>
        <v-list-item @click="addProject('book')"> Add From Book </v-list-item>
        <v-divider></v-divider>
        <v-list-item @click="addProject('doi')"> Add From DOI </v-list-item>
        <v-list-item @click="addProject('arxiv')">
          Add From ArXiv ID
        </v-list-item>
      </v-list>
    </v-menu>

    <v-menu offset-y>
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          icon
          v-bind="attrs"
          v-on="on"
        >
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </template>
      <v-list>
        <!-- the boolean value here indicates whether the project should be deleted from database -->
        <v-list-item @click="$root.$emit('deleteProject', false)">
          Delete From Table
        </v-list-item>
        <v-list-item @click="$root.$emit('deleteProject', true)">
          Delete From DataBase
        </v-list-item>
      </v-list>
    </v-menu>

    <v-spacer></v-spacer>

    <v-text-field
      class="my-0"
      v-model="search"
      @input="$root.$emit('localSearch', search)"
      append-icon="mdi-magnify"
      label="Search"
      single-line
      hide-details
    ></v-text-field>

    <v-spacer></v-spacer>
    <v-btn
      icon
      @click="stateStore.toggleInfoPane"
    >
      <v-icon>mdi-format-list-bulleted</v-icon>
    </v-btn>
  </v-toolbar>
</template>

<script>
import { v4 as uuidv4 } from "uuid";
import { remote } from "electron";
import { useStateStore } from "@/stateStorage";

export default {
  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  data() {
    return {
      search: "",
    };
  },

  methods: {
    addProject(projectType) {
      remote.dialog
        .showOpenDialog({ properties: ["openFile", "multiSelections"] })
        .then((result) => {
          for (let filePath of result.filePaths) {
            var projectId = uuidv4();
            switch (projectType) {
              case "paper":
                let data = {
                  path: filePath,
                  projectId: projectId,
                  projectType: projectType,
                };
                fetch("http://localhost:5000/extract", {
                  mode: "cors",
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(data),
                })
                  .then((response) => {
                    return response.json();
                  })
                  .then((meta) => {
                    this.$root.$emit("addProject", meta);
                  });
                break;

              case "book":
                break;
            }
          }
        })
        .catch((err) => {
          console.log(err);
        });
    },
  },
};
</script>

<style></style>
