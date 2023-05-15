<template>
  <PluginList :isLocal="true" />
  <PluginStore v-model="showPluginStore" />
</template>
<script setup lang="ts">
import { provide, ref } from "vue";
import PluginList from "./PluginList.vue";
import PluginStore from "./PluginStore.vue";
const showPluginStore = ref(false);

provide("togglePluginStore", (show: boolean) => {
  showPluginStore.value = show;
});
</script>
