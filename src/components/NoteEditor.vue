<template>
  <div
    v-show="showEditor"
    id="vditor"
  ></div>
  <div
    v-if="!!!projectStore.workingNote"
    :ripple="false"
    @click="initEditor"
  >
    Add/Select a note in project navigator!
  </div>
</template>
<script>
import { useStateStore } from "src/stores/appState";
import { useProjectStore } from "src/stores/projectStore";
// import { loadNote, saveNote } from "src/backend/note";
import { loadNote, saveNote } from "src/api/project/note";
import Vditor from "vditor";
import "vditor/dist/index.css";

export default {
  props: { hasToolbar: Boolean },

  setup() {
    const stateStore = useStateStore();
    const projectStore = useProjectStore();
    return { stateStore, projectStore, loadNote, saveNote };
  },

  data() {
    return {
      editor: "",
      showEditor: false,
    };
  },

  mounted() {
    if (!!this.projectStore.workingNote) this.showEditor = true;
    this.initEditor();
  },

  watch: {
    "projectStore.workingNote"(newNote, oldNote) {
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
          if (!!this.showEditor) this.setContent();
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
      let note = this.projectStore.workingNote;
      let content = loadNote(note.projectId, note._id);
      console.log("loading content:", content);
      this.editor.setValue(content);
    },

    saveContent() {
      // save the content when it's blur
      // this will be called before unmount
      let content = this.editor.getValue();
      let note = this.projectStore.workingNote;
      saveNote(note.projectId, note._id, content);
      console.log("saving content:", content);
    },
  },
};
</script>
