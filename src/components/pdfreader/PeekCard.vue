<template>
  <q-card
    square
    bordered
    flat
    ref="card"
    class="peekCard"
  >
    <q-card-section
      style="background: var(--color-pdfreader-toolbar-bkgd)"
      class="q-py-none"
    >
      <div class="row justify-end q-py-xs">
        <q-checkbox
          dense
          unelevated
          square
          size="md"
          :ripple="false"
          unchecked-icon="bi-pin-angle-fill"
          checked-icon="bi-pin-fill"
          v-model="pinned"
        ></q-checkbox>
      </div>
    </q-card-section>
    <q-card-section style="height: calc(100% - 28px)">
      <div class="peekContainer">
        <div class="pdfViewer"></div>
      </div>
    </q-card-section>
  </q-card>
</template>
<script setup lang="ts">
import { ref } from "vue";

const card = ref();
const pinned = ref(false);

defineExpose({ card });
</script>
<style lang="scss">
.peekCard {
  background: var(--color-pdfreader-viewer-bkgd);
  display: none;
  border: solid $primary 3px;
}
.peekContainer {
  position: absolute;
  left: 0;
  top: 0;
  overflow: auto;
  height: 100%;
  width: 100%;
}
</style>
