<template>
  <div
    v-show="showEditor"
    ref="vditor"
  ></div>
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
import { debounce } from "quasar";

export default {
  props: { noteId: String, hasToolbar: Boolean },

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
    this.$refs.vditor.setAttribute("id", `vditor-${this.noteId}`);
    this.showEditor = true;
    this.initEditor();
  },

  methods: {
    initEditor() {
      let toolbar = [];
      if (this.hasToolbar)
        toolbar = [
          {
            name: "outline",
            tipPosition: "s",
          },
          "|",
          { name: "headings", tipPosition: "s" },
          { name: "bold", tipPosition: "s" },
          { name: "italic", tipPosition: "s" },
          "|",
          { name: "table", tipPosition: "s" },
          "|",
          { name: "upload", tipPosition: "s", tip: "upload image" },
          { name: "export", tipPosition: "s" },
          "|",
          { name: "help", tipPosition: "s" },
        ];

      this.editor = new Vditor("vditor-" + this.noteId, {
        height: "100%",
        mode: "ir",
        toolbarConfig: {
          pin: true,
        },
        toolbar: toolbar,
        lang: "en_US",
        preview: {
          math: {
            inlineDigit: true,
          },
          hljs: {
            style: "native",
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
          if (!!this.showEditor) this.setContent();
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
          this.saveContent();
          this.changeLinks();
        },
        upload: {
          accept: "image/*",
          handler: (files) => {
            for (let file of files) {
              uploadImage(this.noteId, file).then((uploaded) => {
                this.editor.insertValue(
                  `![${uploaded.imgName}](${uploaded.imgPath})`
                );
              });
            }
          },
        },
      });
    },

    async setContent() {
      let content = await loadNote(this.noteId);
      this.editor.setValue(content);
      this.changeLinks();
    },

    async _saveContent() {
      // save the content when it's blur
      // this will be called before unmount
      let content = this.editor.getValue();
      await saveNote(this.noteId, content);
      await this.saveLinks();
    },

    async saveLinks() {
      let note = await getNote(this.noteId);
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
      updateNote(this.noteId, { links: note.links });
    },

    async clickLink(linkNode) {
      console.log("clicking link", linkNode);
      this.editor.blur(); // save the content before jumping

      // let id = linkNode.href.split("/").at(-1);
      // setTimeout(() => {
      //   this.stateStore.openItemId = id;
      // }, 100);

      let link = linkNode.querySelector(
        "span.vditor-ir__marker--link"
      ).innerText;
      try {
        new URL(link);
        // valid external url, do nothing
      } catch (error) {
        // we just want the document, both getProject or getNote are good
        this.stateStore.openItemId = link;
      }
    },

    _changeLinks() {
      let vditor = this.$refs.vditor;
      // let linkNodes = vditor.querySelectorAll("a");
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

  created() {
    this.saveContent = debounce(this._saveContent, 100);
    this.changeLinks = debounce(this._changeLinks, 50);
  },
};
</script>
<style>
@import "src/css/vditor/vscode-dark-editor.css";
@import "src/css/vditor/vscode-dark-content.css";
</style>
