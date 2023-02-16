<template>
  <PDFReader
    v-if="visible"
    :projectId="itemId"
  />
</template>

<script>
import PDFReader from "src/components/pdfreader/PDFReader.vue";

export default {
  props: { itemId: String, visible: Boolean },

  components: {
    PDFReader,
  },
};
</script>
