<template>
  <div
    v-show="showEditor"
    ref="vditor"
  ></div>
</template>
<script>
import Vditor from "vditor";
import { useStateStore } from "src/stores/appState";
import {
  loadNote,
  saveNote,
  getAllNotes,
  getNote,
  uploadImage,
} from "src/backend/project/note";

import { updateEdge } from "src/backend/project/graph";
import { getAllProjects } from "src/backend/project/project";
import { debounce } from "quasar";

export default {
  props: { noteId: String, hasToolbar: Boolean },

  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  data() {
    return {
      currentNote: null,
      editor: "",
      showEditor: false,

      notes: [],
      projects: [],
      hints: [],
    };
  },

  watch: {
    "stateStore.settings.theme"(theme) {
      this.setTheme(theme);
    },
  },

  beforeMount() {
    this.setTheme(this.stateStore.settings.theme);
  },

  async mounted() {
    this.currentNote = await getNote(this.noteId);
    this.dirPath = window.path.dirname(this.currentNote.path);
    if (process.env.DEV) {
      this.dirPath = "file://" + this.dirPath;
    }
    this.$refs.vditor.setAttribute("id", `vditor-${this.noteId}`);
    this.showEditor = true;
    this.initEditor();
  },

  created() {
    this.saveContent = debounce(this._saveContent, 100);
    this.changeLinks = debounce(this._changeLinks, 50);
    this.addImgResizer = debounce(this._addImgResizer, 50);
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
          markdown: {
            linkBase: this.dirPath,
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
          if (!!this.showEditor) {
            this.setContent();
            let theme = this.stateStore.settings.theme;
            this.editor.setTheme(
              theme,
              theme,
              theme === "dark" ? "solarized-dark256" : "solarized-light"
            );
          }
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
                  `![${uploaded.imgName}](./img/${uploaded.imgName})`
                );
              });
            }
          },
        },
      });
    },

    setTheme(theme) {
      // this is used to set code theme
      if (!!this.editor) {
        this.editor.setTheme(
          theme,
          theme,
          theme === "dark" ? "solarized-dark256" : "solarized-light"
        );
      }

      // must append editorStyle before contentStyle
      // otherwise the texts are dark
      let editorStyle = document.getElementById("vditor-editor-style");
      let contentStyle = document.getElementById("vditor-content-style");
      if (editorStyle === null) {
        editorStyle = document.createElement("link");
        editorStyle.id = "vditor-editor-style";
        editorStyle.type = "text/css";
        editorStyle.rel = "stylesheet";
        document.head.append(editorStyle);
      }
      if (contentStyle === null) {
        contentStyle = document.createElement("link");
        contentStyle.id = "vditor-content-style";
        contentStyle.type = "text/css";
        contentStyle.rel = "stylesheet";
        document.head.append(contentStyle);
      }

      switch (theme) {
        case "dark":
          editorStyle.href = "src/css/vditor/vscode-dark-editor.css";
          contentStyle.href = "src/css/vditor/vscode-dark-content.css";
          break;

        case "light":
          editorStyle.href = "src/css/vditor/vscode-light-editor.css";
          contentStyle.href = "src/css/vditor/vscode-light-content.css";
          break;
      }
    },

    async setContent() {
      let content = await loadNote(this.noteId);
      this.editor.setValue(content);
      this.changeLinks();
      this.addImgResizer();
    },

    async _saveContent() {
      // save the content when it's blur
      // this will be called before unmount
      let content = this.editor.getValue();
      await saveNote(this.noteId, content);
      await this.saveLinks();
    },

    async saveLinks() {
      // let note = await getNote(this.noteId);
      // note.links = [];

      let sourceNode = {
        id: this.currentNote._id,
        label: this.currentNote.label,
        type: this.currentNote.dataType,
      };
      let targetNodes = [];

      let parser = new DOMParser();
      let html = parser.parseFromString(this.editor.getHTML(), "text/html");
      let linkNodes = html.querySelectorAll("a");
      for (let node of linkNodes) {
        let href = node.getAttribute("href");
        href = href.replace(this.dirPath + window.path.sep, "");
        try {
          new URL(href);
          // this is a valid url, do nothing
        } catch (error) {
          // this is an invalid url, might be an id
          if (!href.includes(".")) {
            // note.links.push(href);
            let item = await getNote(href);
            targetNodes.push({
              id: href,
              label: node.innerText,
              type: item?.dataType,
            });
          }
        }
      }
      // updateNote(this.noteId, { links: note.links });

      let data = {
        source: sourceNode.id,
        targets: targetNodes.map((node) => node.id),
        sourceNode: sourceNode,
        targetNodes: targetNodes,
      };
      updateEdge(this.noteId, data);
    },

    async clickLink(e, linkNode) {
      e.stopImmediatePropagation(); // stop propagating the click event
      this.editor.blur(); // save the content before jumping

      let link = linkNode.querySelector(
        "span.vditor-ir__marker--link"
      ).innerText;
      try {
        // valid external url, open it externally
        new URL(link);
        window.browser.openURL(link);
      } catch (error) {
        // we just want the document, both getProject or getNote are good
        this.stateStore.openItemId = link;
        console.log("item id");
      }
    },

    _changeLinks() {
      let vditor = this.$refs.vditor;
      let linkNodes = vditor.querySelectorAll("[data-type='a']");
      for (let linkNode of linkNodes) {
        linkNode.onclick = (e) => this.clickLink(e, linkNode);
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

    _addImgResizer() {
      // TODO
      let vditor = this.$refs.vditor;
      let imgs = vditor.querySelectorAll("img");
      for (let img of imgs) {
        img.onmouseover = () => {
          console.log("on hover");
        };
        img.onmouseleave = () => {
          console.log("on leave");
        };
      }
    },
  },
};
</script>
