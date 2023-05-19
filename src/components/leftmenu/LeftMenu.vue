<template>
  <ProjectNavigator
    v-if="stateStore.ribbonToggledBtnId == 'projectNavigator'"
  />
  <PluginView
    v-else-if="!!stateStore.ribbonToggledBtnId"
    :pluginId="stateStore.ribbonToggledBtnId"
  />
</template>
<script setup lang="ts">
import PluginView from "./PluginView.vue";
import ProjectNavigator from "./ProjectNavigator.vue";
import { useStateStore } from "src/stores/appState";

const stateStore = useStateStore();
</script>
