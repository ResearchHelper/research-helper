<template>
  <q-list class="q-px-xs">
    <q-card
      bordered
      v-for="annot in annotStore.annots"
      :key="annot._id"
      :class="{
        activeAnnotationCard: annot._id == annotStore.selectedAnnotId,
      }"
      @click="annotStore.select(annot._id)"
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
      <div v-else>{{ annot.comment }}</div>
    </q-card>
  </q-list>
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
    // don't know why the annots have empty comments
    annotStore.init();
    return { stateStore, annotStore };
  },

  data() {
    return {
      editor: null,
      editingAnnotId: "",
    };
  },

  methods: {
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
        this.initEditor(annot.comment);
      }, 100);
    },

    confirmAnnotation(annot) {
      // backend
      this.annotStore.update(annot._id, { comment: this.editor.getValue() });

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
