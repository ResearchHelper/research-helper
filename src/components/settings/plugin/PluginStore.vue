<template>
  <q-dialog
    v-model="showPluginStore"
    persistent
    no-shake
    transition-duration="0"
  >
    <div class="container shadow-3">
      <PluginList :isLocal="false" />
    </div>
  </q-dialog>
</template>
<script setup lang="ts">
import { ref } from "vue";
import PluginList from "./PluginList.vue";

const showPluginStore = ref(false);
</script>
<style scoped lang="scss">
.container {
  max-width: 80vw;
  width: 80vw;
  height: 80vh;
  background-color: var(--color-pluginstore-dialog-bkgd);
  border-radius: 0;
}
</style>
