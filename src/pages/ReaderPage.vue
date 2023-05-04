<template>
  <PDFReader
    v-if="visible"
    :projectId="itemId"
  />
</template>

<script setup lang="ts">
import PDFReader from "src/components/pdfreader/PDFReader.vue";
const props = defineProps({
  itemId: { type: String, required: true },
  visible: { type: Boolean, required: true },
});
</script>
