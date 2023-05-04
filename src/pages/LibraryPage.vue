<template>
  <ProjectBrowser v-if="visible" />
</template>
<script setup lang="ts">
import ProjectBrowser from "src/components/library/ProjectBrowser.vue";
const props = defineProps({
  itemId: { type: String, required: true },
  visible: { type: Boolean, required: true },
});
</script>
