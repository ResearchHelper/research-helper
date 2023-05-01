<template>
  <NoteEditor
    v-if="visible"
    :has-toolbar="true"
    :noteId="itemId"
  />
</template>
<script lang="ts">
import { defineComponent } from "vue";
import NoteEditor from "src/components/note/NoteEditor.vue";
export default defineComponent({
  props: { itemId: String, visible: Boolean },

  components: { NoteEditor },
});
</script>
<style lang="scss">
.vditor-reset > pre {
  // Fix padding no matter what window size it is
  padding: 10px 35px !important;
}
</style>
