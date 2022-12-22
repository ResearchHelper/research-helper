<template>
  <NoteEditor
    :has-toolbar="true"
    :noteId="itemId"
  />
</template>
<script>
import NoteEditor from "src/components/NoteEditor.vue";
export default {
  props: { itemId: String },

  components: { NoteEditor },
};
</script>
