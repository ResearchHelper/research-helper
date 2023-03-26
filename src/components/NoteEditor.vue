<template>
  <div
    v-show="showEditor"
    ref="vditor"
  ></div>
</template>
<script>
import Vditor from "vditor";
import "src/css/vditor/index.css";
import darkContent from "src/css/vditor/dark.css?raw";
import lightContent from "src/css/vditor/light.css?raw";
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

    "$el.clientWidth"(width) {
      console.log(width);
    },
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
    await this.$nextTick();
  },

  /**
   * After the component is created, create debounce functions
   */
  created() {
    this.saveContent = debounce(this._saveContent, 100);
    this.changeLinks = debounce(this._changeLinks, 50);
    this.addImgResizer = debounce(this._addImgResizer, 50);
  },

  methods: {
    /************************************************
     * Initialization of vditor
     ************************************************/
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
          { name: "upload", tipPosition: "s", tip: this.$t("upload-image") },
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
        lang: this.stateStore.settings.language,
        tab: "    ", // use 4 spaces as tab
        preview: {
          math: {
            // able to use digit in inline math
            inlineDigit: true,
          },
          markdown: {
            // in DEV mode, load local files instead of server path
            linkBase: this.dirPath,
          },
          hljs: {
            // enable line number in code block
            lineNumber: true,
          },
        },
        placeholder: this.$t("live-markdown-editor-latex-supported"),
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
            this.setTheme(this.stateStore.settings.theme);
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
          this.addImgResizer();
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
          theme === "dark" ? "native" : "emacs"
        );
      }
      // must append editorStyle before contentStyle
      // otherwise the texts are dark
      let contentStyle = document.getElementById("vditor-content-style");
      if (contentStyle === null) {
        contentStyle = document.createElement("style");
        contentStyle.id = "vditor-content-style";
        contentStyle.type = "text/css";
        document.head.append(contentStyle);
      }

      switch (theme) {
        case "dark":
          contentStyle.innerHTML = darkContent;
          break;
        case "light":
          contentStyle.innerHTML = lightContent;
          break;
      }
    },

    /*****************************************
     * Set and save content
     *****************************************/

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
            let item = await getNote(href);
            targetNodes.push({
              id: href,
              label: node.innerText,
              type: item?.dataType,
            });
          }
        }
      }

      let data = {
        source: sourceNode.id,
        targets: targetNodes.map((node) => node.id),
        sourceNode: sourceNode,
        targetNodes: targetNodes,
      };
      await updateEdge(this.noteId, data);
    },

    /*****************************************
     * Modify the default click link behavior
     *****************************************/
    _changeLinks() {
      let vditor = this.$refs.vditor;
      let linkNodes = vditor.querySelectorAll("[data-type='a']");
      for (let linkNode of linkNodes) {
        linkNode.onclick = (e) => this.clickLink(e, linkNode);
      }
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

    /********************************************
     * Add image resize handle on each image in the note
     ********************************************/
    _addImgResizer() {
      let vditor = this.$refs.vditor;
      let imgs = vditor.querySelectorAll("img");
      for (let img of imgs) {
        let p = img.parentElement.parentElement;
        if (!!p.onmouseover) continue;
        // add this only if the image does not have it
        p.onmouseenter = () => {
          let dragHandle = document.createElement("div");
          dragHandle.style.backgroundColor = "grey";
          dragHandle.style.position = "relative";
          dragHandle.style.display = "inline-block";
          dragHandle.style.borderRadius = `${10}px`;
          dragHandle.style.top = `${-img.height / 3}px`;
          dragHandle.style.left = `${-0.05 * img.width}px`;
          dragHandle.style.width = `${5}px`;
          dragHandle.style.height = `${img.height / 3}px`;
          dragHandle.style.zIndex = 10000;
          dragHandle.style.cursor = "ew-resize";

          dragHandle.onmousedown = (e) => {
            e.preventDefault();
            let widthStart = img.width;
            let heightStart = img.height;
            let xStart = e.clientX;
            let ratio = img.height / img.width;

            document.onmousemove = (ev) => {
              let dx = ev.clientX - xStart;
              let dy = ratio * dx;

              img.width = widthStart + dx;
              img.height = heightStart + dy;

              dragHandle.style.top = `${-img.height / 3}px`;
              dragHandle.style.left = `${-0.05 * img.width}px`;
              dragHandle.style.height = `${img.height / 3}px`;
            };

            document.onmouseup = (e) => {
              document.onmousemove = null;
              document.onmouseup = null;
            };
          };
          p.append(dragHandle);

          p.onmouseleave = () => {
            dragHandle.remove();
          };
        };
      }
    },

    /*******************************************
     * Hints
     *******************************************/

    /**
     * Return a filtered list of projects / notes according to key
     * @param {string} key
     */
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
<style>
pre.vditor-reset {
  /* do not change padding after resizing */
  padding: 10px 35px !important;
}
</style>
