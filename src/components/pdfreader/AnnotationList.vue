<template>
  <!-- systembar: 32px, tab: 36px  -->
  <div
    v-if="pdfApp.annotStore?.annots.length === 0"
    style="font-size: 1rem"
  >
    No annotations on this PDF
  </div>
  <q-list
    ref="annotationList"
    dense
  >
    <q-item
      style="padding: 5px 5px"
      v-for="(annot, index) in pdfApp.annotStore?.annots"
      :key="annot.data._id"
    >
      <AnnotCard
        :annot="(annot as Annotation)"
        :style="'width: 100%'"
        :class="{
          activeAnnotation: pdfApp.annotStore?.selectedId === annot.data._id,
        }"
        @click="pdfApp.annotStore?.setActive(annot.data._id)"
        ref="cards"
        :data-cy="`annot-card-${index}`"
      />
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import { inject } from "vue";

import AnnotCard from "./AnnotCard.vue";
import PDFApplicaiton from "src/backend/pdfreader";
import { Annotation } from "src/backend/pdfannotation/annotations";

const pdfApp = inject("pdfApp") as PDFApplicaiton;
</script>

<style scoped>
.activeAnnotationCard {
  border: dashed 2px cyan;
}
</style>
