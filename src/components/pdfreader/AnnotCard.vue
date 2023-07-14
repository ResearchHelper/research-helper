<template>
  <q-card
    :style="style"
    bordered
    flat
    @dblclick="editing = true"
  >
    <q-card-section
      :style="`background: ${annot.data.color}`"
      class="q-py-none"
    >
      <div
        :annot-card-id="annot.data._id"
        class="row justify-between items-center"
      >
        <div
          style="font-size: 1rem"
          class="q-mr-md text-white"
          :class="{ 'text-black': luminosity(annot.data.color) > 0.4 }"
        >
          {{
            annot.data.type.toUpperCase() + " - page" + annot.data.pageNumber
          }}
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
            @copyID="copyToClipboard(annot.data._id)"
            @scrollIntoView="pdfApp.scrollAnnotIntoView(annot.data._id)"
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
import { Annotation } from "src/backend/pdfannotation/annotations";

import AnnotMenu from "./AnnotMenu.vue";

import { debounce, copyToClipboard, colors } from "quasar";
import renderMathInElement from "katex/dist/contrib/auto-render";
import "katex/dist/katex.min.css";
import { AnnotationData } from "src/backend/database";
import PDFApplication from "src/backend/pdfreader";
import { KEY_pdfApp } from "./injectKeys";

const { luminosity } = colors;

const props = defineProps({
  annot: { type: Object as PropType<Annotation>, required: true },
  style: { type: String, required: true },
});

const editing = ref(false);
const content = ref(null); // ref to the <pre> tag

const annotContent = computed({
  get() {
    liveRender(); // render immediately after get content
    return !!props.annot ? props.annot.data.content : "";
  },
  set(content) {
    saveContent(content);
  },
});

const pdfApp = inject(KEY_pdfApp) as PDFApplication;

const _saveContent = (content: string) => {
  pdfApp.annotStore?.update(props.annot.data._id, {
    content: content,
  } as AnnotationData);
};
const saveContent = debounce(_saveContent, 200) as (content: string) => void;

const changeColor = (color: string) => {
  pdfApp.annotStore?.update(props.annot.data._id, {
    color: color,
  } as AnnotationData);
};

const deleteAnnot = () => {
  pdfApp.annotStore?.delete(props.annot.data._id);
};

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
</script>
