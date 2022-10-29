<template>
  <q-tabs
    v-model="this.stateStore.infoPaneTab"
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
    v-model="this.stateStore.infoPaneTab"
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

  methods: {
    modifyInfo() {
      modifyProject(
        this.stateStore.selectedProject.projectId,
        this.stateStore.selectedProject
      );
    },
  },
};
</script>
