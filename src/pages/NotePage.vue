<template>
  <NoteEditor
    v-if="visible"
    :has-toolbar="true"
    :noteId="itemId"
  />
</template>
<script>
import NoteEditor from "src/components/NoteEditor.vue";
export default {
  props: { itemId: String, visible: Boolean },

  components: { NoteEditor },
};
</script>
<style lang="scss">
.vditor-reset > pre {
  padding: 10px 35px !important;
}
</style>
