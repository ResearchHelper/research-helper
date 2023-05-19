<template>
  <div ref="root"></div>
</template>
<script setup lang="ts">
import {
  PropType,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  onUnmounted,
  ref,
} from "vue";
import { View } from "src/backend/database";

const props = defineProps({
  view: { type: Object as PropType<View>, required: true },
});

const root = ref<HTMLElement>();

onBeforeMount(() => {
  if (props.view.onBeforeMount) props.view.onBeforeMount();
});

onMounted(() => {
  if (root.value && props.view.onMounted) props.view.onMounted(root.value);
});

onBeforeUnmount(() => {
  if (props.view.onBeforeUnmount) props.view.onBeforeUnmount();
});

onUnmounted(() => {
  if (props.view.onUnmounted) props.view.onUnmounted();
});
</script>
