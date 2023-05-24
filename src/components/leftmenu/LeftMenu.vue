<template>
  <ProjectNavigator
    v-if="stateStore.ribbonToggledBtnUid == 'projectNavigator'"
  />
  <PluginView
    v-else-if="!!toggledUid"
    :uid="toggledUid"
  />
</template>
<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import PluginView from "./PluginView.vue";
import ProjectNavigator from "./ProjectNavigator.vue";
import { useStateStore } from "src/stores/appState";

const stateStore = useStateStore();
// refresh the plugin view whenever the pluginId is changed
const toggledUid = ref("");
watch(
  () => stateStore.ribbonToggledBtnUid,
  async (uid) => {
    toggledUid.value = "";
    await nextTick();
    toggledUid.value = uid;
  }
);
</script>
