<template>
  <div
    id="vditor-help"
    ref="vditorHelp"
  ></div>
</template>
<script>
import Vditor from "vditor";
import "src/css/vditor/index.css";
import darkContent from "src/css/vditor/dark.css?raw";
import lightContent from "src/css/vditor/light.css?raw";
import text from "src/assets/help.md?raw";

import { useStateStore } from "src/stores/appState";

export default {
  props: { itemId: String, visible: Boolean },

  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  watch: {
    "stateStore.settings.theme"(theme) {
      this.setTheme(theme);
    },
  },

  mounted() {
    const toolbar = [
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
    this.editor = new Vditor("vditor-help", {
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
      placeholder: "Live Markdown editor + Latex supported!",
      cache: {
        enable: false,
      },
      after: () => {
        this.editor.setValue(text);
        this.setTheme(this.stateStore.settings.theme);
      },
    });
  },

  methods: {
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
  },
};
</script>
