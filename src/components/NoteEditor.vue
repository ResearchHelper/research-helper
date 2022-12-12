<template>
  <div
    v-show="showEditor"
    id="vditor"
  ></div>
  <div
    v-if="!!!stateStore.workingNoteId"
    :ripple="false"
    @click="initEditor"
  >
    Add/Select a note in project navigator!
  </div>
</template>
<script>
import Vditor from "vditor";
import "vditor/dist/index.css";
import { useStateStore } from "src/stores/appState";
import {
  loadNote,
  saveNote,
  getAllNotes,
  updateNote,
  getNote,
  uploadImage,
} from "src/backend/project/note";
import { getAllProjects, getProject } from "src/backend/project/project";

export default {
  props: { hasToolbar: Boolean },

  setup() {
    const stateStore = useStateStore();
    return { stateStore, loadNote, saveNote };
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
    if (!!this.stateStore.workingNoteId) this.showEditor = true;
    this.initEditor();
  },

  watch: {
    "stateStore.workingNoteId"(noteId, _) {
      if (!!noteId) {
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
          console.log(this.editor);
        },
        focus: () => {
          // used to filter stuff
          getAllProjects().then((projects) => (this.projects = projects));
          getAllNotes().then((notes) => (this.notes = notes));
        },
        blur: () => {
          this.saveContent();
        },
        input: () => {
          this.changeLinks();
        },
        upload: {
          accept: "image/*",
          handler: (files) => {
            for (let file of files) {
              getNote(this.stateStore.workingNoteId).then((note) => {
                uploadImage(note.projectId, file).then((uploaded) => {
                  this.editor.insertValue(
                    `![${uploaded.imgName}](${uploaded.imgPath})`
                  );
                });
              });
            }
          },
        },
      });
    },

    async setContent() {
      let content = await loadNote(this.stateStore.workingNoteId);
      this.editor.setValue(content);
      this.changeLinks();
    },

    async saveContent() {
      // save the content when it's blur
      // this will be called before unmount
      let content = this.editor.getValue();
      await saveNote(this.stateStore.workingNoteId, content);
      await this.saveLinks();
    },

    async saveLinks() {
      let note = await getNote(this.stateStore.workingNoteId);
      note.links = [];
      let parser = new DOMParser();
      let html = parser.parseFromString(this.editor.getHTML(), "text/html");
      let linkNodes = html.querySelectorAll("a");
      for (let node of linkNodes) {
        let link = node.getAttribute("href");
        try {
          new URL(link);
          // this is a valid url, do nothing
        } catch (error) {
          // this is an invalid url, might be an id
          if (!link.includes(".")) {
            note.links.push(link);
          }
        }
      }
      updateNote(this.stateStore.workingNoteId, { links: note.links });
    },

    async clickLink(linkNode) {
      this.editor.blur(); // save the content before jumping

      let link = linkNode.querySelector(
        "span.vditor-ir__marker--link"
      ).innerText;

      try {
        new URL(link);
        // valid external url, do nothing
      } catch (error) {
        // we just want the document, both getProject or getNote are good
        let doc = await getProject(link);
        if (doc.dataType == "note") {
          this.stateStore.openProject(doc.projectId);
          this.stateStore.workingNoteId = doc._id;
        } else if (doc.dataType == "project") {
          this.stateStore.openProject(doc._id);
        }
      }
    },

    changeLinks() {
      let vditor = document.getElementById("vditor");
      let linkNodes = vditor.querySelectorAll("[data-type='a']");
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
