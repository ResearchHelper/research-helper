<template>
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
      <PDFTOC
        :outline="outline"
        @clickTOC="(node) => $emit('clickTOC', node)"
      />
    </q-tab-panel>

    <q-tab-panel
      v-if="stateStore.currentPage == 'reader'"
      name="annotationTab"
    >
      <AnnotationList ref="annotationList" />
    </q-tab-panel>
  </q-tab-panels>
</template>

<script>
import { useStateStore } from "src/stores/appState";
import AnnotationList from "./pdfreader/AnnotationList.vue";
import MetaInfoTab from "./MetaInfoTab.vue";
import PDFTOC from "./pdfreader/PDFTOC.vue";

export default {
  props: { outline: Array },

  emits: ["clickTOC"],

  components: {
    MetaInfoTab,
    AnnotationList,
    PDFTOC,
  },

  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },
};
</script>
