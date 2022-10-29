<template>
  <div id="vditor"></div>
</template>
<script>
import { useStateStore } from "src/stores/appState";
import { loadNote, saveNote } from "src/backend/note";
import Vditor from "vditor";
import "vditor/dist/index.css";

export default {
  props: { hasToolbar: Boolean },

  setup() {
    const stateStore = useStateStore();
    return { stateStore, loadNote, saveNote };
  },

  data() {
    return {
      editor: "",
    };
  },

  mounted() {
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

  beforeUnmount() {
    this.saveContent();
  },

  watch: {
    "stateStore.workingNote"(oldNote, newNote) {
      this.setContent();
    },
  },

  methods: {
    setContent() {
      let note = this.stateStore.workingNote;
      console.log(note);
      this.editor.setValue(loadNote(note.projectId, note.noteId));
    },

    saveContent() {
      // save the content when it's blur
      let content = this.editor.getValue();
      let note = this.stateStore.workingNote;
      saveNote(note.projectId, note.noteId, content);
    },
  },
};
</script>
