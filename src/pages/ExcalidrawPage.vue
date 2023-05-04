<template>
  <ExcalidrawReact
    :visible="show"
    :noteId="itemId"
  />
</template>

<script setup lang="ts">
// veaury and excalidraw
import { applyPureReactInVue } from "veaury";
import CustomExcalidraw from "src/components/note/CustomExcalidraw";
import { onMounted, ref } from "vue";
const props = defineProps({
  visible: { type: Boolean, reqruied: true },
  itemId: { type: String, required: true },
});

const ExcalidrawReact = applyPureReactInVue(CustomExcalidraw);
const show = ref(props.visible);

onMounted(() => {
  // MUST STOP render the react component before this vue component is unmounted
  // this can avoid maximum call stack size exceeds error from veaury
  let activeTitle = document.querySelector('span[class="lm_title lm_focused"]');
  if (!activeTitle) return;
  let closeControl = activeTitle.nextElementSibling as HTMLDivElement;
  if (!closeControl.getAttribute("itemId"))
    closeControl.setAttribute("itemId", props.itemId);
  if (!closeControl) return;
  closeControl.onmousedown = (e) => {
    if ((e.target as HTMLDivElement).getAttribute("itemId") === props.itemId)
      show.value = false;
  };
});
</script>
