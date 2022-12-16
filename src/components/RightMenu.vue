<template>
  <div v-if="stateStore.rightMenuMode == 'infoPane'">
    <q-tabs
      v-model="stateStore.rightMenuTab"
      dense
      align="justify"
      indicator-color="transparent"
      active-bg-color="primary"
    >
      <q-tab
        name="metaInfoTab"
        icon="info"
        :ripple="false"
      />
      <q-tab
        v-if="stateStore.currentPage == 'reader'"
        name="tocTab"
        icon="toc"
        :ripple="false"
      />
      <q-tab
        v-if="stateStore.currentPage == 'reader'"
        name="annotationTab"
        icon="edit"
        :ripple="false"
      />
    </q-tabs>

    <q-tab-panels v-model="stateStore.rightMenuTab">
      <q-tab-panel name="metaInfoTab">
        <MetaInfoTab />
      </q-tab-panel>

      <q-tab-panel
        v-if="stateStore.currentPage == 'reader'"
        name="tocTab"
      >
        <PDFTOC />
      </q-tab-panel>

      <q-tab-panel
        v-if="stateStore.currentPage == 'reader'"
        name="annotationTab"
      >
        <AnnotationList ref="annotationList" />
      </q-tab-panel>
    </q-tab-panels>
  </div>
  <!-- <NoteEditor
    v-if="stateStore.rightMenuMode == 'noteEditor'"
    :has-toolbar="true"
  /> -->
</template>

<script>
import { useStateStore } from "src/stores/appState";
// import NoteEditor from "./NoteEditor.vue";
import AnnotationList from "./pdfreader/AnnotationList.vue";
import MetaInfoTab from "./MetaInfoTab.vue";
import PDFTOC from "./pdfreader/PDFTOC.vue";

export default {
  components: {
    MetaInfoTab,
    // NoteEditor,
    AnnotationList,
    PDFTOC,
  },

  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },
};
</script>
