<template>
  <q-menu data-cy="annot-menu">
    <q-list dense>
      <q-item>
        <ColorPicker @selected="(color: string) => changeColor(color)" />
      </q-item>
      <q-item>
        <div
          class="button full-width"
          v-close-popup
          @click="copyID()"
        >
          <div style="font-size: 1rem">
            <q-icon name="content_copy"></q-icon>
            {{ $t("copy-annot-id") }}
          </div>
        </div>
      </q-item>
      <q-item>
        <div
          class="button full-width"
          v-close-popup
          @click="deleteAnnot()"
        >
          <div style="font-size: 1rem">
            <q-icon name="delete_outline"></q-icon>
            {{ $t("delete-annot") }}
          </div>
        </div>
      </q-item>
    </q-list>
  </q-menu>
</template>

<script setup lang="ts">
import ColorPicker from "./ColorPicker.vue";

const emit = defineEmits(["changeColor", "deleteAnnot", "copyID"]);
const changeColor = (color: string) => emit("changeColor", color);
const deleteAnnot = () => emit("deleteAnnot");
const copyID = () => emit("copyID");
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
