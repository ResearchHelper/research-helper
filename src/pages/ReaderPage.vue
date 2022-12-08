<template>
  <div>
    <PDFReader />
  </div>
</template>

<script>
import PDFReader from "src/components/pdfreader/PDFReader.vue";

export default {
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
