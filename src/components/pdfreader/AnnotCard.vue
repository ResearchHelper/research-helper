<template>
  <q-card
    v-if="!!annot"
    :style="style"
    bordered
    flat
    @dblclick="editing = true"
  >
    <q-card-section
      :style="`background: ${annot.color}`"
      class="q-py-none text-black"
    >
      <div
        :annot-card-id="annot._id"
        class="row justify-between items-center"
      >
        <div
          style="font-size: 1rem"
          class="q-mr-md"
        >
          {{ annot.type.toUpperCase() + " - page" + annot.pageNumber }}
        </div>

        <q-btn
          dense
          flat
          padding="none"
          :ripple="false"
          icon="more_vert"
        >
          <AnnotMenu
            @changeColor="(color: string) => updateAnnot({id: annotId, data:{color: color}})"
            @deleteAnnot="() => deleteAnnot(annotId)"
            @copyID="copyToClipboard(annotId)"
          />
        </q-btn>
      </div>
    </q-card-section>
    <q-input
      v-if="editing"
      outlined
      square
      autogrow
      autofocus
      input-style="font-size: 1rem"
      v-model="annotContent"
      @blur="editing = false"
    />
    <pre
      ref="content"
      style="
        font-size: 1rem;
        min-height: 5em;
        max-width: 50vw;
        max-height: 30vh;
        white-space: pre-wrap;
        overflow: auto;
        border: 0.1rem dashed grey;
      "
      class="q-mx-xs q-my-xs"
      >{{ annotContent }}</pre
    >
  </q-card>
</template>
<script setup lang="ts">
import { ref, inject, onMounted, nextTick, PropType, computed } from "vue";
import { Annotation } from "src/backend/database";
import { KEY_deleteAnnot, KEY_updateAnnot } from "./injectKeys";

import AnnotMenu from "./AnnotMenu.vue";

import { debounce, copyToClipboard } from "quasar";
import renderMathInElement from "katex/dist/contrib/auto-render";
import "katex/dist/katex.min.css";

const props = defineProps({
  annot: { type: Object as PropType<Annotation>, required: true },
  style: String,
});

const editing = ref(false);
const content = ref(null); // ref to the <pre> tag

const annotContent = computed({
  get() {
    liveRender(); // render immediately after get content
    return props.annot.content;
  },
  set(content) {
    saveContent(content);
  },
});

const updateAnnot = inject(KEY_updateAnnot) as (params: any) => void;
const deleteAnnot = inject(KEY_deleteAnnot) as (id: string) => void;

const _saveContent = (content: string) => {
  if (props.annot === undefined) return;
  updateAnnot({
    id: props.annot._id,
    data: { content: content },
  });
};

const saveContent = debounce(_saveContent, 200) as (content: string) => void;

const liveRender = async () => {
  await nextTick();
  renderMathInElement(content.value, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "$", right: "$", display: false },
      { left: "\\(", right: "\\)", display: false },
      { left: "\\[", right: "\\]", display: true },
    ],
    ignoredTags: ["script", "noscript", "style", "textarea", "code", "option"],
    throwOnError: false,
  });
};
</script>
