<template>
  <div
    id="vditor-help"
    ref="vditorHelp"
  ></div>
</template>
<script>
import Vditor from "vditor";
import "vditor/dist/index.css";

import text from "src/assets/help.md?raw";

export default {
  props: { itemId: String, visible: Boolean },

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
            hint: () => [],
          },
        ],
      },
      after: () => {
        this.editor.setValue(text);
      },
    });
  },
};
</script>

<style>
@import "src/css/vditor/vscode-dark-editor.css";
@import "src/css/vditor/vscode-dark-content.css";
</style>
