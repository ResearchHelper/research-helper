<template>
  <div></div>
  <ExcalidrawReact
    :visible="visible"
    :noteId="itemId"
  />
</template>

<script setup lang="ts">
// veaury and excalidraw
import { applyPureReactInVue } from "veaury";
import CustomExcalidraw from "src/components/note/CustomExcalidraw";

const props = defineProps({
  visible: { type: Boolean, reqruied: true },
  itemId: { type: String, required: true },
});

const ExcalidrawReact = applyPureReactInVue(CustomExcalidraw);
</script>
