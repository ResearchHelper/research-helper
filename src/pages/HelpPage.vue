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
import text_en_US from "src/assets/help_en_US.md?raw";
import text_zh_CN from "src/assets/help_zh_CN.md?raw";
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

    "stateStore.settings.language"(lang) {
      console.log(lang);
      this.editor.setValue(
        this.$i18n.locale === "zh_CN" ? text_zh_CN : text_en_US
      );
    },
  },

  async mounted() {
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
      { name: "upload", tipPosition: "s", tip: this.$t("upload-image") },
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
      placeholder: this.$t("live-markdown-editor-latex-supported"),
      cache: {
        enable: false,
      },
      after: () => {
        this.editor.setValue(
          this.$i18n.locale === "zh_CN" ? text_zh_CN : text_en_US
        );
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
<style>
pre.vditor-reset {
  /* do not change padding after resizing */
  padding: 10px 35px !important;
}
</style>
