<template>
  <div
    v-show="showEditor"
    id="vditor"
  ></div>
  <div
    v-if="!!!stateStore.workingNote"
    :ripple="false"
    @click="initEditor"
  >
    Add/Select a note in project navigator!
  </div>
</template>
<script>
import { useStateStore } from "src/stores/appState";
import { addNote, loadNote, saveNote } from "src/backend/note";
import Vditor from "vditor";
import "vditor/dist/index.css";

export default {
  props: { hasToolbar: Boolean },

  setup() {
    const stateStore = useStateStore();
    return { stateStore, addNote, loadNote, saveNote };
  },

  data() {
    return {
      editor: "",
      showEditor: false,
    };
  },

  mounted() {
    if (!!this.stateStore.workingNote) this.showEditor = true;
    this.initEditor();
  },

  watch: {
    "stateStore.workingNote"(newNote, oldNote) {
      if (!!newNote) {
        if (!!!this.showEditor) this.showEditor = true;
        this.setContent();
      } else {
        if (!!this.showEditor) this.showEditor = false;
      }
    },
  },

  methods: {
    initEditor() {
      let toolbar = [];
      if (this.hasToolbar)
        toolbar = [
          "outline",
          "|",
          "headings",
          "bold",
          "italic",
          "link",
          "|",
          "quote",
          "list",
          "ordered-list",
          "table",
          "inline-code",
          "code",
          "|",
          "upload",
          "export",
          "|",
          "fullscreen",
        ];

      this.editor = new Vditor("vditor", {
        height: 500,
        toolbarConfig: {
          pin: true,
        },
        toolbar: toolbar,
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
          // dark theme, dark content theme, native code theme
          this.editor.setTheme("dark", "dark", "native");
          this.setContent();
        },
        blur: () => {
          this.saveContent();
        },
        upload: {
          accept: "image/*",
        },
      });
    },

    setContent() {
      let note = this.stateStore.workingNote;
      let content = loadNote(note.projectId, note.noteId);
      this.editor.setValue(content);
    },

    saveContent() {
      // save the content when it's blur
      // this will be called before unmount
      let content = this.editor.getValue();
      let note = this.stateStore.workingNote;
      saveNote(note.projectId, note.noteId, content);
    },
  },
};
</script>
