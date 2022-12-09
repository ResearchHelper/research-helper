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
import { loadNote, saveNote, getAllNotes } from "src/backend/project/note";
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

      notes: [],
      projects: [],
      hints: [],
    };
  },

  async mounted() {
    if (!!this.projectStore.workingNote) this.showEditor = true;
    this.initEditor();
    // used to filter stuff
    this.projects = await this.projectStore.getAll();
    this.notes = await getAllNotes();
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
        hint: {
          parse: false,
          delay: 200, // unit: ms
          extend: [
            {
              key: "[[",
              hint: this.filterHints,
            },
          ],
        },
        after: () => {
          // dark theme, dark content theme, native code theme
          this.editor.setTheme("dark", "dark", "native");
          if (!!this.showEditor) this.setContent();
        },
        blur: () => {
          this.saveContent();
        },
        input: () => {
          this.changeLinks();
        },
      });
    },

    setContent() {
      let note = this.projectStore.workingNote;
      let content = loadNote(note.projectId, note._id);
      this.editor.setValue(content);
      this.changeLinks();
    },

    saveContent() {
      // save the content when it's blur
      // this will be called before unmount
      let content = this.editor.getValue();
      let note = this.projectStore.workingNote;
      saveNote(note.projectId, note._id, content);
    },

    async clickLink(linkNode) {
      this.editor.blur(); // save the content before jumping

      let link = linkNode.querySelector(
        "span.vditor-ir__marker--link"
      ).innerText;
      let doc = await this.projectStore.get(link);
      if (doc.dataType == "note") {
        await this.projectStore.setWorkingProject(doc.projectId);
        this.projectStore.workingNote = doc;
      } else if (doc.dataType == "project") {
        this.projectStore.setWorkingProject(doc._id);
      }
    },

    changeLinks() {
      let vditor = document.getElementById("vditor");
      let linkNodes = vditor.querySelectorAll("[data-type='a']");
      console.log("changing link nodes");
      for (let linkNode of linkNodes) {
        linkNode.onclick = () => this.clickLink(linkNode);
      }
    },

    filterHints(key) {
      this.hints = [];
      for (let item of this.projects.concat(this.notes)) {
        if (item.dataType == "project") item.label = item.title;
        if (item.label.toLocaleLowerCase().indexOf(key) > -1) {
          this.hints.push({
            value: `[${item.label}](${item._id})`,
            html: `<p class="ellipsis"><strong>${item.dataType}</strong>: ${item.label}</p>`,
          });
        }
      }
      return this.hints;
    },
  },
};
</script>
