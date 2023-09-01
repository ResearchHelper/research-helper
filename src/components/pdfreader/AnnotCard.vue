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
          :class="{ 'text-black': luminosity(annot.data.color) > 0.4 }"
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
    <div>
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
      <div
        ref="mdContentDiv"
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
      ></div>
    </div>
  </q-card>
</template>
<script setup lang="ts">
import { ref, inject, PropType, computed, onMounted } from "vue";
import { Annotation } from "src/backend/pdfannotation/annotations";

import AnnotMenu from "./AnnotMenu.vue";

import { copyToClipboard, colors } from "quasar";
import { AnnotationData } from "src/backend/database";
import PDFApplication from "src/backend/pdfreader";
import { KEY_pdfApp } from "./injectKeys";
import Vditor from "vditor/dist/method.min";
import { useStateStore } from "src/stores/appState";
const { luminosity } = colors;
const stateStore = useStateStore();

const props = defineProps({
  annot: { type: Object as PropType<Annotation>, required: true },
  style: { type: String, required: true },
});
const pdfApp = inject(KEY_pdfApp) as PDFApplication;

const editing = ref(false);
const mdContentDiv = ref();
const annotContent = computed({
  get() {
    return props.annot.data.content;
  },
  set(text: string) {
    if (mdContentDiv.value)
      Vditor.preview(mdContentDiv.value, text, {
        theme: stateStore.settings.theme === "dark" ? "dark" : "classic",
        mode: stateStore.settings.theme,
        hljs: {
          lineNumber: true,
          style: stateStore.settings.theme === "dark" ? "native" : "emacs",
        },
        after: changeLinks,
      });
    pdfApp.annotStore?.update(props.annot.data._id, {
      content: text,
    } as AnnotationData);
  },
});

onMounted(() => {
  if (mdContentDiv.value)
    Vditor.preview(mdContentDiv.value, props.annot.data.content, {
      theme: stateStore.settings.theme === "dark" ? "dark" : "classic",
      mode: stateStore.settings.theme,
      hljs: {
        lineNumber: true,
        style: stateStore.settings.theme === "dark" ? "native" : "emacs",
      },
      after: changeLinks,
    });
});

const changeColor = (color: string) => {
  pdfApp.annotStore?.update(props.annot.data._id, {
    color: color,
  } as AnnotationData);
};

const deleteAnnot = () => {
  pdfApp.annotStore?.delete(props.annot.data._id);
};

function changeLinks() {
  if (!mdContentDiv.value) return;
  let linkNodes = mdContentDiv.value.querySelectorAll(
    "a"
  ) as NodeListOf<HTMLAnchorElement>;
  for (let linkNode of linkNodes) {
    console.log(linkNode);
    linkNode.onclick = (e) => {
      e.preventDefault();
      try {
        // valid external url, open it externally
        new URL(linkNode.href);
        window.browser.openURL(linkNode.href);
      } catch (error) {
        console.log(error);
      }
    };
  }
}
</script>
