<template>
  <div ref="root"></div>
</template>
<script setup lang="ts">
import {
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  onUnmounted,
  ref,
} from "vue";
import { ComponentName } from "src/backend/database";
import pluginManager from "src/backend/plugin";

const props = defineProps({
  uid: { type: String, required: true },
});
const root = ref<HTMLElement | null>(null);
const views = ref(pluginManager.getViews(ComponentName.LEFT_MENU));

onBeforeMount(() => {
  for (let view of views.value) {
    if (view.uid === props.uid)
      if (root.value && view.onBeforeMount) view.onBeforeMount();
  }
});

onMounted(() => {
  for (let view of views.value) {
    if (view.uid === props.uid)
      if (root.value && view.onMounted) view.onMounted(root.value);
  }
});

onBeforeUnmount(() => {
  for (let view of views.value) {
    if (view.uid === props.uid)
      if (root.value && view.onBeforeUnmount) view.onBeforeUnmount();
  }
});

onUnmounted(() => {
  for (let view of views.value) {
    if (view.uid === props.uid)
      if (root.value && view.onUnmounted) view.onUnmounted();
  }
});
</script>
