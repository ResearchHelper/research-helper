<template>
  <!-- systembar: 32px, tab: 36px  -->
  <q-scroll-area style="height: calc(100vh - 68px)">
    <q-list class="q-px-xs">
      <q-card
        bordered
        v-for="annot in annotStore.annots"
        :key="annot._id"
        :class="{
          activeAnnotationCard: annot._id == annotStore.selectedAnnotId,
        }"
        @click="clickAnnotCard(annot._id)"
      >
        <q-card-section class="q-py-none">
          <div
            :annot-card-id="annot._id"
            class="row justify-between items-center"
          >
            <p>
              <span class="text-h6"> {{ annot.type.toUpperCase() }} </span>
              {{ " page" + annot.pageNumber }}
            </p>

            <q-btn
              dense
              flat
              :ripple="false"
              icon="more_horiz"
            >
              <q-menu>
                <q-list dense>
                  <q-item
                    clickable
                    v-close-popup
                    @click="editAnnotation(annot)"
                  >
                    Edit
                  </q-item>
                  <q-item
                    clickable
                    v-close-popup
                    @click="annotStore.delete(annot._id)"
                  >
                    Delete
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </q-card-section>
        <q-separator />
        <div v-if="annot._id == editingAnnotId">
          <div id="commentEditor"></div>
          <div class="row justify-end">
            <q-btn
              dense
              flat
              :ripple="false"
              @click="destroyEditor()"
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
        </div>
        <!-- DO NOT use annot.comment -->
        <!-- pouchdb fetch empty comment, maybe it is not working right -->
        <div v-else>{{ annot.content }}</div>
      </q-card>
    </q-list>
  </q-scroll-area>
</template>

<script>
import Vditor from "vditor";
import "vditor/dist/index.css";
import { useStateStore } from "src/stores/appState";
import { useAnnotStore } from "src/stores/annotStore";

export default {
  setup() {
    const stateStore = useStateStore();
    const annotStore = useAnnotStore();
    return { stateStore, annotStore };
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
    clickAnnotCard(annotId) {
      // a weird trick to trigger the watch in PDFReader.vue
      // so we can click on the already selected card to scroll into view
      this.annotStore.selectedAnnotId = null;
      this.$nextTick(() => {
        this.annotStore.selectedAnnotId = annotId;
      });
    },

    initEditor(content) {
      let editorArea = document.getElementById("commentEditor");
      this.editor = new Vditor(editorArea, {
        toolbar: [],
        lang: "en_US",
        preview: {
          math: {
            inlineDigit: true,
          },
        },
        placeholder: "Live Markdown editor + Latex supported!",
        cache: {
          enable: false,
        },
        after: () => {
          this.editor.setValue(content);
        },
      });
    },

    destroyEditor() {
      this.editingAnnotId = "";
      this.editor.destroy();
    },

    editAnnotation(annot) {
      this.editingAnnotId = annot._id;
      setTimeout(() => {
        this.initEditor(annot.content);
      }, 100);
    },

    confirmAnnotation(annot) {
      // backend
      this.annotStore.update(annot._id, { content: this.editor.getValue() });

      // destroy editor
      this.destroyEditor();
    },
  },
};
</script>

<style>
.activeAnnotationCard {
  border: solid 2px cyan;
}
</style>
