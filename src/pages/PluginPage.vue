<template>
  <div ref="root"></div>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";
import pluginManager from "src/backend/plugin";
import { ComponentName, View } from "src/backend/database";

const props = defineProps({
  itemId: { type: String, required: true },
  visible: { type: Boolean, required: true },
});

const root = ref<HTMLDivElement | null>(null);
const views = ref<View[]>([]);
views.value = pluginManager.getViews(ComponentName.PLUGIN_PAGE);
onMounted(() => {
  console.log(views.value);
  for (let view of views.value) {
    if (view.uid === props.itemId) {
      if (root.value && view.onMounted) view.onMounted(root.value);
    }
  }
});
</script>
