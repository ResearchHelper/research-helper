<template>
  <q-list dense>
    <q-expansion-item
      dense
      dense-toggle
      expand-separator
      default-opened
      label="Projects"
      group="group"
    >
      <ProjectTree />
    </q-expansion-item>
    <q-expansion-item
      dense
      dense-toggle
      expand-separator
      label="Table of Contents"
      group="group"
    >
      <PDFTOC />
    </q-expansion-item>
  </q-list>
</template>

<script>
import PDFTOC from "./PDFTOC.vue";
import ProjectTree from "../ProjectTree.vue";

export default {
  components: { PDFTOC, ProjectTree },
};
</script>
