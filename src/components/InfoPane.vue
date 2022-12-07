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

    <q-tab-panels v-model="stateStore.infoPaneTab">
      <q-tab-panel
        v-if="!!stateStore.selectedProject"
        name="metaInfoTab"
      >
        <MetaInfoTab />
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
import MetaInfoTab from "./MetaInfoTab.vue";

export default {
  components: {
    MetaInfoTab,
    NoteEditor,
    AnnotationList,
  },

  setup() {
    const stateStore = useStateStore();
    return { stateStore, modifyProject };
  },
};
</script>
