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
        <div class="q-mr-md">
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
            :annotId="annotId"
            @update="(params) => updateAnnot(params)"
            @delete="(params) => deleteAnnot(params)"
          />
        </q-btn>
      </div>
    </q-card-section>
    <q-input
      v-if="editing"
      v-model="annot.content"
      @update:model-value="onInput"
      @blur="editing = false"
      outlined
      square
      autogrow
      autofocus
    />
    <pre
      ref="content"
      style="white-space: pre-wrap"
      class="q-mx-sm q-my-xs"
      >{{ annot.content }}</pre
    >
  </q-card>
</template>
<script>
import { debounce } from "quasar";
import { getAnnotationById } from "src/backend/pdfreader/annotation";
import renderMathInElement from "katex/dist/contrib/auto-render";
import "katex/dist/katex.min.css";

import AnnotMenu from "./AnnotMenu.vue";

export default {
  props: { annotId: String, style: String },
  emits: ["close", "update", "delete"],

  components: {
    AnnotMenu,
  },

  data() {
    return {
      editing: false,
      annot: null,
    };
  },

  async mounted() {
    await this.getContent();
    await this.liveRender();
  },

  created() {
    const _saveContent = () => {
      this.$emit("update", {
        id: this.annot._id,
        data: { content: this.annot.content },
      });
    };

    this.saveContent = debounce(_saveContent, 200);
  },

  methods: {
    async getContent() {
      this.annot = await getAnnotationById(this.annotId);
    },

    async onInput() {
      await this.saveContent();
      await this.liveRender();
    },

    async liveRender() {
      await this.$nextTick();
      renderMathInElement(this.$refs.content, {
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
        ],
        throwOnError: false,
      });
    },

    updateAnnot(params) {
      for (let key in params.data) {
        this.annot[key] = params.data[key];
      }
      this.$emit("update", params);
    },

    deleteAnnot(params) {
      this.$emit("delete", params);
    },
  },
};
</script>
