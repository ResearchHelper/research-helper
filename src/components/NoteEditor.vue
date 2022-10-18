<template>
  <div id="vditor"></div>
</template>
<script>
import Vditor from "vditor";
import "vditor/dist/index.css";

export default {
  data() {
    return {
      editor: "",
    };
  },
  mounted() {
    this.editor = new Vditor("vditor", {
      height: 360,
      toolbarConfig: {
        pin: true,
      },
      toolbar: [
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
      ],
      fullscreen: {
        index: 10000,
      },
      lang: "en_US",
      placeholder: "Live Markdown editor + Latex supported!",
      cache: {
        enable: false,
      },
      after: () => {
        // dark theme, dark content theme, native code theme
        this.editor.setTheme("dark", "dark", "native");
      },
    });

    // this.editor.setTheme("dark");
  },
};
</script>
