<template>
  <ExcalidrawReact
    v-if="visible"
    :noteId="itemId"
  />
</template>

<script setup lang="ts">
// veaury and excalidraw
import { applyPureReactInVue } from "veaury";
import CustomExcalidraw from "src/components/note/CustomExcalidraw";

const ExcalidrawReact = applyPureReactInVue(CustomExcalidraw);

const props = defineProps({
  visible: Boolean,
  itemId: { type: String, required: true },
});
</script>
