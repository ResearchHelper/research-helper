<template>
  <PDFReader
    v-if="visible"
    :projectId="itemId"
  />
</template>

<script setup lang="ts">
import PDFReader from "src/components/pdfreader/PDFReader.vue";
const props = defineProps({
  visible: { type: Boolean, reqruied: true },
  itemId: { type: String, required: true },
  data: { type: Object, requried: false },
});
</script>
