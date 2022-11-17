<template>
  <div>
    <div id="commentEditorArea"></div>
    <q-btn
      dense
      square
      flat
      icon="close"
      style="color: black"
      @click="$emit('closeCommentEditor')"
    ></q-btn>
    <q-btn
      dense
      square
      flat
      icon="delete"
      style="color: black"
      @click="$emit('deleteComment')"
    ></q-btn>
  </div>
</template>

<script>
import Vditor from "vditor";
import "vditor/dist/index.css";

export default {
  data() {
    return {
      editor: null,
    };
  },

  mounted() {
    let editorArea = document.getElementById("commentEditorArea");
    this.editor = new Vditor(editorArea, {
      toolbar: [],
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
        // this.editor.setTheme("dark", "dark", "native");
        // this.setContent();
        console.log("after");
      },
      blur: () => {
        // this.saveContent();
        console.log("blur");
      },
    });
  },

  methods: {
    focus() {
      this.editor.focus();
    },
  },
};
</script>
