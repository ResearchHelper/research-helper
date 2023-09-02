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
import { onMounted, PropType, ref, watchEffect } from "vue";
import { useStateStore } from "src/stores/appState";
const stateStore = useStateStore();

const props = defineProps({
  content: { type: String },
  data: {
    type: Object as PropType<{ linkBase: string; content: string }>,
    required: true,
  },
});
const emit = defineEmits(["clickLink"]);
const card = ref();
const mdContentDiv = ref();

watchEffect(() => {
  if (props.data.content && mdContentDiv.value)
    Vditor.preview(mdContentDiv.value, props.data.content, {
      theme: stateStore.settings.theme === "dark" ? "dark" : "classic",
      mode: stateStore.settings.theme,
      hljs: {
        lineNumber: true,
        style: stateStore.settings.theme === "dark" ? "native" : "emacs",
      },
      after: changeLinks,
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

function changeLinks() {
  if (!mdContentDiv.value) return;

  let linkNodes = mdContentDiv.value.querySelectorAll(
    "a"
  ) as NodeListOf<HTMLAnchorElement>;
  for (let linkNode of linkNodes) {
    linkNode.onclick = (e: MouseEvent) => {
      // do not open link winthin app
      e.preventDefault();
      let link = linkNode.href
        .replace("http://localhost:9300/", "") // in dev mode
        .replace(/^file:.*app\.asar\//, ""); // in production mode
      emit("clickLink", e, link);
    };
  }

  let imageNodes = mdContentDiv.value.querySelectorAll(
    "img"
  ) as NodeListOf<HTMLImageElement>;
  for (let imageNode of imageNodes) {
    imageNode.src = imageNode.src
      .replace("http://localhost:9300", props.data.linkBase) // in dev mode
      .replace(/^file:.*app\.asar/, props.data.linkBase); // in production mode
  }
}

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
