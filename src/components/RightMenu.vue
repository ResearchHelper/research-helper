<template>
  <div v-if="stateStore.rightMenuMode == 'infoPane'">
    <q-tabs
      v-model="stateStore.rightMenuTab"
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
    </q-tabs>

    <q-tab-panels v-model="stateStore.rightMenuTab">
      <q-tab-panel name="metaInfoTab">
        <MetaInfoTab />
      </q-tab-panel>

      <q-tab-panel
        v-if="stateStore.currentPage == 'reader'"
        name="annotationTab"
      >
        <AnnotationList ref="annotationList" />
      </q-tab-panel>
    </q-tab-panels>
  </div>
  <NoteEditor
    v-if="stateStore.rightMenuMode == 'noteEditor'"
    :has-toolbar="true"
  />
</template>

<script>
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
    return { stateStore };
  },
};
</script>
