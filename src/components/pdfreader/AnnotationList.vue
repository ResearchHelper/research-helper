<template>
  <!-- systembar: 32px, tab: 36px  -->
  <div
    v-if="annotStore.annots.length === 0"
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
      v-for="(annot, index) in annotStore.annots"
      :key="annot.data._id"
    >
      <AnnotCard
        :annot="(annot as Annotation)"
        :style="'width: 100%'"
        :class="{ activeAnnotation: annotStore.selectedId === annot.data._id }"
        @click="annotStore.setActive(annot.data._id)"
        ref="cards"
        :data-cy="`annot-card-${index}`"
      />
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import { inject } from "vue";

import AnnotCard from "./AnnotCard.vue";
import { AnnotationStore } from "src/backend/pdfannotation";
import { Annotation } from "src/backend/pdfannotation/annotations";
import { KEY_annotStore } from "./injectKeys";

const annotStore = inject(KEY_annotStore) as AnnotationStore;
</script>

<style scoped>
.activeAnnotationCard {
  border: dashed 2px cyan;
}
</style>
