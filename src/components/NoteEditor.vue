<template>
  <div ref="editor">
    <div ref="content">
      <!-- <p
        v-for="i in 10"
        :key="i"
      ></p> -->
    </div>
  </div>
</template>

<script>
// TODO: link
// TODO: code block coloring
// ENHANCEMENT: cannot exit code block when there's no lines nearby (make lines initially so user can exit code block easily)
import {
  EditorState,
  EditorView,
  DOMParser,
  schema,
  setup,
} from "./prosemirror";

export default {
  mounted() {
    // create prosemirror state
    let state = EditorState.create({
      // schema: schema,
      doc: DOMParser.fromSchema(schema).parse(this.$refs.content),
      plugins: setup({ schema }),
    });

    // create prosemirror view
    let view = new EditorView(this.$refs.editor, {
      state,
    });
  },
};
</script>

<style lang="scss">
// @import "prosemirror-view/style/prosemirror.css"; // do not import this!, .ProseMirror {position: relative} makes the cursor disappear in inline math node
@import "@benrbray/prosemirror-math/style/math.css";
@import "katex/dist/katex.min.css";
@import "prosemirror-image-plugin/dist/styles/common.css";
@import "prosemirror-image-plugin/dist/styles/withResize.css";
@import "prosemirror-image-plugin/dist/styles/sideResize.css";
@import "prosemirror-image-plugin/dist/styles/withoutResize.css";

// Editor with dark theme
.ProseMirror {
  background-color: rgb(22, 22, 22);
  padding: 4px 8px 4px 14px;
  outline: none;
  white-space: pre-wrap;
  height: 500px;
  overflow: auto;
}

.ProseMirror p {
  margin: 0;
}

.ProseMirror-menubar-wrapper {
  border: 1px solid #000;
  --lila1: #2b2b2b;
  --lila2: #353535;
}

.ProseMirror-menuitem {
  margin: 0 2px;
  border-radius: 4px;
  display: inline-block;
}

.ProseMirror-menuitem:hover {
  background-color: #ddd;
}

.ProseMirror-menuseparator {
  border-right: 1px solid #000;
  margin-right: 1px;
  margin-left: 1px;
}

.ProseMirror-menu-active {
  background: var(--lila1);
  color: black;
  border-radius: 4px;
}

.ProseMirror-menu-disabled {
  color: #ddd;
}

.ProseMirror-menu-disabled:hover {
  cursor: default;
  background-color: white;
}

.ProseMirror-menubar {
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;
  min-height: 1em;
  color: #666;
  padding: 0.5em;
  background: rgb(44, 44, 44);
  box-sizing: border-box;
  overflow: visible;
}

.ProseMirror-icon {
  display: inline-block;
  line-height: 0.8;
  vertical-align: -2px;
  padding: 2px 8px;
  cursor: pointer;
}

.ProseMirror-icon svg {
  fill: currentColor;
  height: 1em;
}

.ProseMirror-icon span {
  vertical-align: text-top;
}

.ProseMirror-selectednode {
  background-color: var(--lila1);
}

.ProseMirror p:hover,
.ProseMirror li:hover,
.ProseMirror ul:hover,
.ProseMirror ol:hover {
  background-color: rgba(129, 129, 129, 0.04);
}

// fix far away top and bottom in math-display
math-display .math-src .ProseMirror {
  height: fit-content;
}

// image
</style>
