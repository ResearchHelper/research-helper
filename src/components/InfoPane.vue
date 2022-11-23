<template>
  <div>
    <q-tabs
      v-model="stateStore.infoPaneTab"
      dense
    >
      <q-tab
        name="metaInfoTab"
        :ripple="false"
      >
        Meta Info
      </q-tab>
      <q-tab
        v-if="stateStore.currentPage == 'reader'"
        name="annotationTab"
        :ripple="false"
      >
        Annotations
      </q-tab>
      <q-tab
        v-if="stateStore.currentPage == 'reader'"
        name="noteTab"
        :ripple="false"
      >
        Notes
      </q-tab>
    </q-tabs>

    <q-tab-panels
      v-if="!!stateStore.selectedProject"
      v-model="stateStore.infoPaneTab"
    >
      <q-tab-panel name="metaInfoTab">
        <!-- systembar: 32px, tab: 36px  -->
        <q-scroll-area style="height: calc(100vh - 68px)">
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
            style="height: 500px"
            filled
            type="textarea"
            label="Abstract"
            v-model="stateStore.selectedProject.abstract"
            @blur="modifyInfo"
          />
        </q-scroll-area>
      </q-tab-panel>

      <q-tab-panel
        v-if="stateStore.currentPage == 'reader'"
        name="annotationTab"
      >
        <AnnotationList ref="annotationList" />
      </q-tab-panel>

      <q-tab-panel
        v-if="stateStore.currentPage == 'reader'"
        name="noteTab"
      >
        <NoteEditor :has-toolbar="true" />
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<script>
import { modifyProject } from "src/backend";
import { useStateStore } from "src/stores/appState";
import NoteEditor from "./NoteEditor.vue";
import AnnotationList from "./pdfreader/AnnotationList.vue";

export default {
  components: {
    NoteEditor,
    AnnotationList,
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
