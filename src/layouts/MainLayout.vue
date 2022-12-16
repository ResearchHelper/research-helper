<template>
  <SystemBar />
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent, ref } from "vue";
import SystemBar from "src/components/SystemBar.vue";

export default defineComponent({
  name: "MainLayout",

  components: {
    SystemBar,
  },
});
</script>
