<template>
  <ActionBar
    :showAddBtn="isLocal"
    :showCloseBtn="!isLocal"
    @search="(text:string
  ) => filterPlugins(text)"
  />
  <PluginCard
    v-for="plugin in filteredPlugins"
    class="q-mx-md"
    :key="plugin.id"
    :meta="plugin"
    :installed="isLocal"
    @togglePlugin="(enable: boolean) => togglePlugin(plugin, enable)"
  />
</template>
<script setup lang="ts">
import { ref } from "vue";
import { PluginMeta } from "src/backend/database";
import ActionBar from "./ActionBar.vue";
import PluginCard from "./PluginCard.vue";

const props = defineProps({
  isLocal: { type: Boolean, required: true },
});
const plugins = ref<PluginMeta[]>([
  {
    id: "plugin1",
    name: "Example plugin 1",
    author: "Hunt Feng",
    version: "1.0.0",
    description: "A example plugin for testing",
    github: "https://github.com/ResearchHelper/research-helper",
    enabled: true,
  },
  {
    id: "plugin2",
    name: "Example plugin 2",
    author: "Hunt Feng",
    version: "2.0.3",
    description: "Another example plugin for testing",
    github: "https://github.com/ResearchHelper/research-helper",
    enabled: false,
  },
]);
const filteredPlugins = ref(plugins.value);

function filterPlugins(text: string | null) {
  if (text === null) return;
  filteredPlugins.value = [];
  let re = RegExp(text, "i"); // case insensitive
  filteredPlugins.value = plugins.value.filter((plugin) => {
    for (let [key, value] of Object.entries(plugin)) {
      if (key === "enabled") continue;
      if ((value as string).search(re) != -1) return true;
    }
  });
}

function togglePlugin(plugin: PluginMeta, enable: boolean) {
  plugin.enabled = enable;

  // update db
}
</script>
