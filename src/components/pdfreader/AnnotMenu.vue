<template>
  <q-menu>
    <q-list dense>
      <q-item>
        <ColorPicker @selected="changeColor" />
      </q-item>
      <q-item>
        <div
          class="button full-width"
          v-close-popup
          @click="copyID"
        >
          <q-icon name="content_copy"></q-icon>
          Copy Annot ID
        </div>
      </q-item>
      <q-item>
        <div
          class="button full-width"
          v-close-popup
          @click="deleteAnnot"
        >
          <q-icon name="delete"></q-icon>
          Delete Annot
        </div>
      </q-item>
    </q-list>
  </q-menu>
</template>

<script>
import { copyToClipboard } from "quasar";
import ColorPicker from "./ColorPicker.vue";

export default {
  props: { annotId: String },
  emits: ["update", "delete"],

  components: { ColorPicker },

  methods: {
    changeColor(color) {
      this.$emit("update", { id: this.annotId, data: { color: color } });
    },

    copyID() {
      copyToClipboard(this.annotId);
    },

    deleteAnnot() {
      this.$emit("delete", { id: this.annotId });
    },
  },
};
</script>

<style scoped lang="scss">
.button {
  cursor: pointer;
  padding-left: 10px !important;
  padding-right: 10px !important;
  &:hover {
    background: grey;
  }
}
</style>
