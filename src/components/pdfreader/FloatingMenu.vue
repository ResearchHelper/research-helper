<template>
  <div class="row items-center q-px-sm q-py-xs">
    <ColorPicker @selected="(color: string) => $emit('highlightText', color)" />
    <q-btn
      class="q-ml-sm"
      dense
      :ripple="false"
      size="md"
      padding="none"
      icon="content_copy"
      @click="copyText"
      data-cy="btn-copy"
    >
      <q-tooltip>{{ $t("copy") }}</q-tooltip>
    </q-btn>
  </div>
</template>

<script setup lang="ts">
import { copyToClipboard } from "quasar";
import ColorPicker from "./ColorPicker.vue";
defineEmits(["highlightText"]);

function copyText() {
  let selection = window.getSelection();
  if (selection) copyToClipboard(selection.toString());
}
</script>
