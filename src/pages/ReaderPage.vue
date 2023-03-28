<template>
  <PDFReader
    v-if="visible"
    :projectId="itemId"
  />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import PDFReader from "src/components/pdfreader/PDFReader.vue";

export default defineComponent({
  props: { itemId: String, visible: Boolean },

  components: {
    PDFReader,
  },
});
</script>
