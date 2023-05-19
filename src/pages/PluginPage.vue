<template>
  <div ref="root"></div>
  <!-- <component :is="card"></component> -->
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";
import pluginManager from "src/backend/plugin";

const props = defineProps({
  itemId: { type: String, required: true },
  visible: { type: Boolean, required: true },
});

const root = ref<HTMLDivElement | null>(null);
const card = ref(null);

onMounted(() => {
  for (let [pluginId, plugin] of pluginManager.plugins.value.entries()) {
    let view = plugin.pageView;
    if (view.pageId == props.itemId) {
      view.mount.bind(plugin);
      console.log(view.mount);
      if (root.value) view.mount(root.value);

      // FIXME: component is not reactive ...
      // console.log("component", view.vueComponent);
      // card.value = view.vueComponent;
      // setTimeout(() => {
      //   card.value = plugin.pageView.vueComponent;
      //   console.log("refresh");
      // }, 2000);
    }
  }
});
</script>
