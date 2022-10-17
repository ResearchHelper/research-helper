<template>
  <q-tabs v-model="leftMenuTab">
    <q-tab
      name="projects"
      label="Projects"
    />
    <q-tab
      name="toc"
      label="Table of Contents"
    />
  </q-tabs>
  <q-separator />
  <q-tab-panels v-model="leftMenuTab">
    <q-tab-panel name="projects"> <ProjectTree /> </q-tab-panel>
    <q-tab-panel name="toc">
      <PDFTOC
        :pdfDocument="pdfDocument"
        @clickTOC="(pageNumber) => $emit('changePageNumber', pageNumber)"
      />
    </q-tab-panel>
  </q-tab-panels>
</template>

<script>
import PDFTOC from "./PDFTOC.vue";
import ProjectTree from "./ProjectTree.vue";

export default {
  components: { PDFTOC, ProjectTree },

  props: ["pdfDocument"],

  // define this to avoid the extraneous non-emits warning
  // https://stackoverflow.com/questions/64220737/vue-3-emit-warning-extraneous-non-emits-event-listeners
  emits: ["changePageNumber"],

  data() {
    return {
      leftMenuTab: "projects",
    };
  },
};
</script>
