<template>
  <SystemBar />
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import SystemBar from "src/components/systembar/SystemBar.vue";

export default {
  name: "MainLayout",

  components: {
    SystemBar,
  },
};
</script>
