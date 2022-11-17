<template>
  <q-list class="q-px-xs">
    <q-card
      bordered
      v-for="annot in annotations"
      :key="annot.id"
      :class="{
        activeAnnotationCard: annot.id == stateStore.selectedAnnotId,
      }"
      @click="clickAnnotationCard(annot)"
    >
      <q-card-section class="q-py-none">
        <div class="row justify-between items-center">
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
                  @click="deleteAnnotation(annot)"
                >
                  Delete
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </q-card-section>
      <q-separator />
      <div v-if="annot.id == editingAnnotId">
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
            @click="updateAnnotation(annot)"
          >
            Confirm
          </q-btn>
        </div>
      </div>
      <div v-else>{{ annot.content }}</div>
    </q-card>
  </q-list>
</template>

<script>
import Vditor from "vditor";
import "vditor/dist/index.css";
import { useStateStore } from "src/stores/appState";
import { AnnotationManager, AnnotationType } from "src/annotation";

export default {
  data() {
    return {
      editor: null,
      editingAnnotId: "",

      annotations: [],
      selectedAnnotId: "",
      selectedAnnot: null,
      prvSelectedAnnot: null,
    };
  },

  watch: {
    "annotManager.annotations": {
      handler(newAnnotations, oldAnnotations) {
        console.log("added new annotation");
        this.getAnnotations();
      },
      deep: true,
    },
  },

  setup() {
    const stateStore = useStateStore();
    const annotManager = new AnnotationManager();
    return { stateStore, annotManager };
  },

  mounted() {
    this.getAnnotations();
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

    getAnnotations() {
      let annotDict = this.annotManager.annotations;
      for (let page in annotDict) {
        for (let annot of annotDict[page]) {
          this.annotations.push(annot);
        }
      }
    },

    editAnnotation(annot) {
      console.log("edit");
      this.editingAnnotId = annot.id;
      setTimeout(() => {
        this.initEditor(annot.content);
      }, 100);
    },

    deleteAnnotation(annot) {
      // remove from disk and pdf page
      this.annotManager.deleteAnnotation(annot.id);

      // remove from annotation list
      this.annotations = this.annotations.filter(
        (annotation) => annotation.id != annot.id
      );
    },

    updateAnnotation(annot) {
      // backend
      this.annotManager.modifyAnnotation(annot.id, {
        content: this.editor.getValue(),
      });

      // destroy editor
      this.destroyEditor();
    },

    clickAnnotationCard(annot) {
      this.stateStore.selectedAnnotId = annot.id;
      let newAnnot = document.getElementById(annot.id);
      console.log(newAnnot);
    },
  },
};
</script>

<style>
.activeAnnotation {
  border: dashed 2px cyan;
}
.activeAnnotationCard {
  border: solid 2px cyan;
}
</style>
