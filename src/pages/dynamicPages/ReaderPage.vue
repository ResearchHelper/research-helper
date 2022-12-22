<template>
  <div>
    <PDFReader
      :projectId="itemId"
      :visible="visible"
    />
  </div>
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

<style lang="scss">
.separator {
  &:hover {
    width: 5px;
    background-color: $primary;
  }
  &:active {
    width: 5px;
    background-color: $primary;
  }
}
</style>
