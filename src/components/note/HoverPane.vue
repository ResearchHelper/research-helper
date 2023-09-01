<template>
  <q-card
    ref="card"
    class="hoverPane"
  >
    <q-card-section v-if="content">
      <div ref="mdContentDiv"></div>
    </q-card-section>
  </q-card>
</template>
<script setup lang="ts">
import Vditor from "vditor/dist/method.min";
import { onMounted, ref, watchEffect } from "vue";
import { useStateStore } from "src/stores/appState";
const stateStore = useStateStore();

const props = defineProps({
  content: { type: String },
});

const card = ref();
const mdContentDiv = ref();

watchEffect(() => {
  if (props.content && mdContentDiv.value)
    Vditor.preview(mdContentDiv.value, props.content, {
      theme: stateStore.settings.theme === "dark" ? "dark" : "classic",
      mode: stateStore.settings.theme,
      hljs: {
        lineNumber: true,
        style: stateStore.settings.theme === "dark" ? "native" : "emacs",
      },
    });
});

onMounted(async () => {
  if (!card.value) return;
  card.value.$el.onmouseenter = () => {
    card.value.$el.onmouseleave = () => {
      card.value.$el.hidden = true;
    };
  };
});

defineExpose({ card });
</script>
<style lang="scss">
.hoverPane {
  position: absolute;
  width: 40%;
  max-height: 30%;
  overflow: auto;
}
</style>
