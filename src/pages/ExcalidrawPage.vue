<template>
  <ExcalidrawReact
    :visible="show"
    :noteId="itemId"
  />
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { applyPureReactInVue } from "veaury";
import CustomExcalidraw from "src/components/note/CustomExcalidraw";
import { useStateStore } from "src/stores/appState";

const stateStore = useStateStore();

const props = defineProps({
  itemId: { type: String, required: true },
  visible: { type: Boolean, reqruied: true },
  data: { type: Object, requried: false },
});

const ExcalidrawReact = applyPureReactInVue(CustomExcalidraw);
const show = ref(props.visible);

// if closing project from project tree
watch(
  () => stateStore.closedPageId,
  (id: string) => {
    if (id === props.itemId) show.value = false;
  }
);

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
