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
      class="q-py-none"
    >
      <div
        :annot-card-id="annot._id"
        class="row justify-between items-center"
      >
        <div
          style="font-size: 1rem"
          class="q-mr-md text-white"
          :class="{ 'text-black': luminosity(annot.color) > 0.4 }"
        >
          {{ annot.type.toUpperCase() + " - page" + annot.pageNumber }}
        </div>

        <q-btn
          dense
          flat
          padding="none"
          :ripple="false"
          icon="more_vert"
          data-cy="btn-menu"
        >
          <AnnotMenu
            @changeColor="(color: string) => changeColor(color)"
            @deleteAnnot="deleteAnnot()"
            @copyID="copyToClipboard(annot._id)"
            @scrollIntoView="scrollAnnotIntoView(annot._id)"
          />
        </q-btn>
      </div>
    </q-card-section>
    <div
      v-if="annotContent.indexOf('data:') == 0"
      class="q-px-xs q-pt-xs q-pb-none"
    >
      <img
        style="width: 100%; max-height: 30vh; border: 0.1rem dashed grey"
        :src="annotContent"
      />
    </div>
    <div v-else>
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
        class="q-ma-xs"
        data-cy="annot-content"
        >{{ annotContent }}</pre
      >
    </div>
  </q-card>
</template>
<script setup lang="ts">
import { ref, inject, nextTick, PropType, computed } from "vue";
import { Annotation } from "src/backend/database";
import {
  KEY_deleteAnnot,
  KEY_scrollAnnotIntoView,
  KEY_updateAnnot,
} from "./injectKeys";

import AnnotMenu from "./AnnotMenu.vue";

import { debounce, copyToClipboard, colors } from "quasar";
import renderMathInElement from "katex/dist/contrib/auto-render";
import "katex/dist/katex.min.css";

const { luminosity } = colors;

const props = defineProps({
  annot: Object as PropType<Annotation>,
  style: String,
});

const editing = ref(false);
const content = ref(null); // ref to the <pre> tag

const annotContent = computed({
  get() {
    liveRender(); // render immediately after get content
    return !!props.annot ? props.annot.content : "";
  },
  set(content) {
    saveContent(content);
  },
});

const _updateAnnot = inject(KEY_updateAnnot) as (params: any) => void;
const _deleteAnnot = inject(KEY_deleteAnnot) as (id: string) => void;
const scrollAnnotIntoView = inject(KEY_scrollAnnotIntoView) as (
  id: string
) => void;

const _saveContent = (content: string) => {
  if (props.annot === undefined) return;
  _updateAnnot({
    id: props.annot._id,
    data: { content: content },
  });
};

const saveContent = debounce(_saveContent, 200) as (content: string) => void;

const liveRender = async () => {
  await nextTick();
  if (!content.value) return;
  renderMathInElement(content.value, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "$", right: "$", display: false },
      { left: "\\(", right: "\\)", display: false },
      { left: "\\[", right: "\\]", display: true },
    ],
    ignoredTags: [
      "script",
      "noscript",
      "style",
      "textarea",
      "code",
      "option",
      "img",
    ],
    throwOnError: false,
  });
};

const changeColor = (color: string) => {
  if (props.annot === undefined) return;
  _updateAnnot({ id: props.annot._id, data: { color: color } });
};

const deleteAnnot = () => {
  if (props.annot === undefined) return;
  _deleteAnnot(props.annot._id);
};
</script>
