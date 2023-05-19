<template>
  <ProjectNavigator
    v-if="stateStore.ribbonToggledBtnId == 'projectNavigator'"
  />
  <PluginView
    v-else-if="!!toggledId"
    :pluginId="toggledId"
  />
</template>
<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import PluginView from "./PluginView.vue";
import ProjectNavigator from "./ProjectNavigator.vue";
import { useStateStore } from "src/stores/appState";

const stateStore = useStateStore();
// refresh the plugin view whenever the pluginId is changed
const toggledId = ref("");
watch(
  () => stateStore.ribbonToggledBtnId,
  async (id) => {
    toggledId.value = "";
    await nextTick();
    toggledId.value = id;
  }
);
</script>
