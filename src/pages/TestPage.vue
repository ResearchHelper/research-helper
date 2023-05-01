<template>
  <ExcalidrawReact />
</template>

<script setup lang="ts">
import { applyPureReactInVue, getReactNode } from "veaury";
import CustomExcalidraw from "src/components/note/CustomExcalidraw.jsx";

const ExcalidrawReact = applyPureReactInVue(CustomExcalidraw);
</script>
