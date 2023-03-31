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
          :annotId="annot._id"
          :style="'width: 100%'"
          :class="{ activeAnnotation: selectedAnnotId === annot._id }"
          @update="(params) => updateAnnot(params)"
          @delete="(params) => deleteAnnot(params)"
          @click="clickAnnotCard(annot._id)"
          ref="cards"
        />
      </q-item>
    </q-list>
  </q-scroll-area>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { Annotation } from "src/backend/database";
import AnnotCard from "./AnnotCard.vue";

export default defineComponent({
  props: {
    selectedAnnotId: String,
    annots: { type: Array as PropType<Annotation[]>, required: true },
  },
  emits: ["update:selectedAnnotId", "update", "delete"],

  components: { AnnotCard },

  methods: {
    clickAnnotCard(annotId: string) {
      this.$emit("update:selectedAnnotId", annotId);
    },

    updateAnnot(params) {
      // update db
      this.$emit("update", params);

      // ui update is already taken care by the AnnotCard
    },

    deleteAnnot(params) {
      // update db
      this.$emit("delete", params);

      // no need to update ui since annots list is managed by annotManager
    },

    updateList() {
      for (let card of this.$refs.cards as (typeof AnnotCard)[]) {
        card.getContent();
      }
    },
  },
});
</script>

<style scoped>
.activeAnnotationCard {
  border: dashed 2px cyan;
}
</style>
