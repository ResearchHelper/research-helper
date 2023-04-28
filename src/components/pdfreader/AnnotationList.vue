<template>
  <!-- systembar: 32px, tab: 36px  -->
  <q-scroll-area style="height: 100%">
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
        v-for="annot in annots"
        :key="annot._id"
      >
        <AnnotCard
          :annot="annot"
          :style="'width: 100%'"
          :class="{ activeAnnotation: selectedAnnotId === annot._id }"
          @click="setActiveAnnot(annot._id)"
          ref="cards"
        />
      </q-item>
    </q-list>
  </q-scroll-area>
</template>

<script setup lang="ts">
import { inject } from "vue";
import { Annotation } from "src/backend/database";
import {
  KEY_annots,
  KEY_selectedAnnotId,
  KEY_setActiveAnnot,
} from "./injectKeys";

import AnnotCard from "./AnnotCard.vue";

let selectedAnnotId = inject(KEY_selectedAnnotId) as string;
let annots = inject(KEY_annots) as Annotation[];

const setActiveAnnot = inject(KEY_setActiveAnnot) as (id: string) => void;
</script>

<style scoped>
.activeAnnotationCard {
  border: dashed 2px cyan;
}
</style>
