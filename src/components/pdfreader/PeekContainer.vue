<template>
  <!-- <q-card -->
  <!--   bordered -->
  <!--   flat -->
  <!-- > -->
  <!--   <q-card-section class="q-py-none"> -->
  <!--     <div class="row justify-end"> -->
  <!--       <q-btn -->
  <!--         dense -->
  <!--         flat -->
  <!--         size="sm" -->
  <!--         name="push_pin" -->
  <!--       ></q-btn> -->
  <!--     </div> -->
  <!--   </q-card-section> -->
  <!--   <div -->
  <!--     class="peekContainer" -->
  <!--     ref="viewer" -->
  <!--   > -->
  <!--     <div class="pdfViewer"></div> -->
  <!--   </div> -->
  <!-- </q-card> -->
  <div
    class="peekContainer"
    ref="viewer"
  >
    <div class="pdfViewer"></div>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

const viewer = ref();

defineExpose({ viewer });
</script>
<style lang="scss">
.peekContainer {
  position: absolute;
  overflow: auto;
  background: var(--color-pdfreader-viewer-bkgd);
  border: solid $primary 3px;
}
</style>
