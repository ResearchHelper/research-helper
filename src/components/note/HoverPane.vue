<template>
  <q-card
    ref="card"
    class="hoverPane"
  >
    <div v-if="!!project">
      <q-card-section class="q-pb-none">
        <div class="text-h6">{{ project.title }}</div>
        <p style="font-size: 0.9rem">
          Author(s): {{ authorToString(project.author) }}
        </p>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <p style="font-size: 1rem">Abstract: {{ project.abstract }}</p>
      </q-card-section>
    </div>
    <q-card-section v-if="!!note">
      <div ref="mdContentDiv"></div>
    </q-card-section>
  </q-card>
</template>
<script setup lang="ts">
import { onMounted, PropType, ref, watchEffect } from "vue";
import { Project } from "src/backend/database";
import { authorToString } from "src/backend/project/utils";
import Vditor from "vditor/dist/method.min";

const props = defineProps({
  project: { type: Object as PropType<Project> },
  note: { type: Object as PropType<{ label: string; content: string }> },
});

const card = ref();
const mdContentDiv = ref();

watchEffect(() => {
  if (props.note && mdContentDiv.value)
    Vditor.preview(mdContentDiv.value, props.note.content, {
      mode: "dark",
      theme: "dark",
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
