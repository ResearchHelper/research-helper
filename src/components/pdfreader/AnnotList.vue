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
      :key="annot.data._id"
    >
      <AnnotCard
        v-if="annot.data.type !== AnnotationType.INK"
        :annot="(annot as Annotation)"
        :style="'width: 100%'"
        :class="{
          activeAnnotation: selectedId === annot.data._id,
        }"
        @click="$emit('setActive', annot.data._id)"
        ref="cards"
        :data-cy="`annot-card-${index}`"
      />
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import { PropType } from "vue";
import { Annotation } from "src/backend/pdfannotation/annotations";
import { AnnotationType } from "src/backend/database";

import AnnotCard from "./AnnotCard.vue";

const props = defineProps({
  annots: { type: Object as PropType<Annotation[]>, required: true },
  selectedId: { type: String, required: true },
});
const emit = defineEmits(["setActive"]);
</script>
