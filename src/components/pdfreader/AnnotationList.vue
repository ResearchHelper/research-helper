<template>
  <!-- systembar: 32px, tab: 36px  -->
  <div
    v-if="annots.length === 0"
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
      v-for="(annot, index) in annots"
      :key="annot._id"
    >
      <AnnotCard
        :annot="annot"
        :style="'width: 100%'"
        :class="{ activeAnnotation: selectedAnnotId === annot._id }"
        @click="setActiveAnnot(annot._id)"
        ref="cards"
        :data-cy="`annot-card-${index}`"
      />
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import { inject, PropType } from "vue";
import { Annotation } from "src/backend/database";
import { KEY_setActiveAnnot } from "./injectKeys";

import AnnotCard from "./AnnotCard.vue";

const props = defineProps({
  annots: { type: Object as PropType<Annotation[]>, required: true },
  selectedAnnotId: { type: String, required: true },
});
const setActiveAnnot = inject(KEY_setActiveAnnot) as (id: string) => void;
</script>

<style scoped>
.activeAnnotationCard {
  border: dashed 2px cyan;
}
</style>
