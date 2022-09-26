<template>
  <q-tabs
    v-model="infoPaneTab"
    dense
  >
    <q-tab
      name="metaInfoTab"
      :ripple="false"
    >
      Meta Info
    </q-tab>
    <q-tab
      name="noteTab"
      :ripple="false"
    >
      Notes
    </q-tab>
  </q-tabs>
  <q-tab-panels
    v-if="stateStore.selectedProject"
    v-model="infoPaneTab"
  >
    <q-tab-panel name="metaInfoTab">
      <q-input
        filled
        type="textarea"
        label="Title"
        v-model="stateStore.selectedProject.title"
        @blur="modifyInfo"
      />
      <q-input
        filled
        type="textarea"
        label="Author(s)"
        v-model="stateStore.selectedProject.author"
        @blur="modifyInfo"
      />
      <q-input
        filled
        type="textarea"
        label="Abstract"
        v-model="stateStore.selectedProject.abstract"
        @blur="modifyInfo"
      />
    </q-tab-panel>

    <q-tab-panel name="noteTab">
      <NoteEditor />
    </q-tab-panel>
  </q-tab-panels>
</template>

<script>
import { modifyProject } from "src/backend";
import { useStateStore } from "src/stores/appState";
import NoteEditor from "./NoteEditor.vue";

export default {
  components: {
    NoteEditor,
  },

  setup() {
    const stateStore = useStateStore();
    return { stateStore, modifyProject };
  },

  data() {
    return {
      infoPaneTab: "metaInfoTab",
    };
  },

  methods: {
    modifyInfo() {
      modifyProject(
        this.stateStore.selectedProject.projectId,
        this.stateStore.selectedProject
      );
      // fetch(
      //   "http://localhost:5000/project/" +
      //     this.stateStore.selectedProject.projectId,
      //   {
      //     mode: "cors",
      //     method: "PUT",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify(this.stateStore.selectedProject),
      //   }
      // ).then((response) => {
      //   console.log(response);
      // });
    },
  },
};
</script>
