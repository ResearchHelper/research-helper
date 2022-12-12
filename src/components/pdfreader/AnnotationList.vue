<template>
  <!-- systembar: 32px, tab: 36px  -->
  <q-scroll-area style="height: calc(100vh - 68px)">
    <q-list
      class="q-mx-sm"
      id="annotationList"
    >
      <q-card
        v-for="annot in annotStore.annots"
        :key="annot._id"
        bordered
        class="q-my-sm"
        :class="{
          activeAnnotationCard: annot._id == annotStore.selectedAnnotId,
        }"
        @click="clickAnnotCard(annot._id)"
        @dblclick="editAnnotation(annot._id)"
      >
        <q-card-section
          :style="`background: ${annot.color}`"
          class="q-py-none text-black"
        >
          <div
            :annot-card-id="annot._id"
            class="row justify-between items-center"
          >
            <div>
              {{ annot.type.toUpperCase() + " - page" + annot.pageNumber }}
            </div>

            <q-btn
              dense
              flat
              :ripple="false"
              icon="more_horiz"
            >
              <q-menu>
                <q-color
                  v-close-popup
                  no-header
                  no-footer
                  bordered
                  default-view="palette"
                  :palette="[
                    '#FFFF00',
                    '#019A9D',
                    '#D9B801',
                    '#E8045A',
                    '#B2028A',
                    '#2A0449',
                  ]"
                  v-model="annot.color"
                  @update:model-value="
                    annotStore.update(annot._id, { color: annot.color })
                  "
                />
                <div class="row justify-end">
                  <q-btn
                    class="col-1 text-red"
                    unelevated
                    :ripple="false"
                    icon="delete"
                    @click="annotStore.delete(annot._id)"
                  />
                  <q-btn
                    class="col-1"
                    unelevated
                    v-close-popup
                    :ripple="false"
                    icon="edit_note"
                    @click="editAnnotation(annot._id)"
                  />
                </div>
              </q-menu>
            </q-btn>
          </div>
        </q-card-section>
        <q-separator />
        <div v-if="annot._id == editingAnnotId">
          <pre
            style="border: solid 1px white"
            class="q-ma-none"
            contenteditable
            @input="(e) => liveRender(e, annot)"
            >{{ annot.content }}</pre
          >
          <div class="row justify-end">
            <q-btn
              dense
              flat
              :ripple="false"
              @click="editingAnnotId = ''"
            >
              Cancel
            </q-btn>
            <q-btn
              dense
              flat
              :ripple="false"
              @click="confirmAnnotation(annot)"
            >
              Confirm
            </q-btn>
          </div>
          <q-separator />
        </div>
        <pre
          :annot-content-id="annot._id"
          class="q-ma-sm"
          >{{ annot.content }}</pre
        >
      </q-card>
    </q-list>
  </q-scroll-area>
</template>

<script>
import renderMathInElement from "katex/dist/contrib/auto-render";
import "katex/dist/katex.min.css";
import { useStateStore } from "src/stores/appState";
import { useAnnotStore } from "src/stores/annotStore";

export default {
  setup() {
    const stateStore = useStateStore();
    const annotStore = useAnnotStore();
    return { stateStore, annotStore };
  },

  mounted() {
    let doms = document.querySelectorAll("[annot-content-id]");
    for (let dom of doms) {
      this.renderMath(dom);
    }
  },

  data() {
    return {
      editor: null,
      editingAnnotId: "",
    };
  },

  watch: {
    "annotStore.selectedAnnotId"(annotId, _) {
      if (!!annotId) {
        // AnnotationList scrollIntoView
        let card = document.querySelector(`div[annot-card-id="${annotId}"]`);
        card.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    },
  },

  methods: {
    renderMath(dom) {
      renderMathInElement(dom, {
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

    liveRender(e, annot) {
      annot.content = e.target.innerText;
      this.$nextTick(() => {
        this.renderMath(this.renderingDOM);
      });
    },

    clickAnnotCard(annotId) {
      // a weird trick to trigger the watch in PDFReader.vue
      // so we can click on the already selected card to scroll into view
      this.annotStore.selectedAnnotId = null;
      this.$nextTick(() => {
        this.annotStore.selectedAnnotId = annotId;
      });
    },

    editAnnotation(annotId) {
      this.editingAnnotId = annotId;
      this.renderingDOM = document.querySelector(
        `[annot-content-id='${annotId}']`
      );
    },

    confirmAnnotation(annot) {
      // backend
      this.annotStore.update(annot._id, { content: annot.content });

      // update ui
      this.editingAnnotId = "";
      this.renderMath(this.renderingDOM);
      // render the math before making this dom null
      this.renderingDOM = null;
    },
  },
};
</script>

<style>
.activeAnnotationCard {
  border: dashed 2px cyan;
}
</style>
