<template>
  <ActionBar
    v-model:search="search"
    :showAddBtn="isLocal"
    :showCloseBtn="!isLocal"
  />
  <PluginCard
    v-if="filteredMetas.length > 0"
    v-for="meta in filteredMetas"
    class="q-mx-md"
    :key="meta.id"
    :meta="meta"
    :status="pluginManager.statusMap.value.get(meta.id)"
    @toggle="(enable: boolean) => pluginManager.toggle(meta.id, enable)"
    @install="install(meta)"
    @uninstall="uninstall(meta)"
  />
  <h6 v-else>{{ $t("no-plugins") }}</h6>
</template>
<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { PluginMeta } from "src/backend/database";
import ActionBar from "./ActionBar.vue";
import PluginCard from "./PluginCard.vue";
import pluginManager from "src/backend/plugin";

const props = defineProps({
  isLocal: { type: Boolean, required: true },
});

const filteredMetas = ref<PluginMeta[]>([]);
const search = ref("");

watch(search, (text: string) => {
  filteredMetas.value = pluginManager.filter(text, props.isLocal);
});

async function install(meta: PluginMeta) {
  await pluginManager.download(meta);
  filteredMetas.value = pluginManager.filter(search.value, props.isLocal);
}

async function uninstall(meta: PluginMeta) {
  await pluginManager.delete(meta);
  filteredMetas.value = pluginManager.filter(search.value, props.isLocal);
}

onMounted(async () => {
  if (props.isLocal) {
    filteredMetas.value = pluginManager.pluginMetas.value;
  } else {
    await pluginManager.getCommunityMetas();
    filteredMetas.value = pluginManager.communityMetas.value;
  }
});
</script>
