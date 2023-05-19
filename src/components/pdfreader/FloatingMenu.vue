<template>
  <div style="z-index: 100">
    <div class="row items-center q-px-sm q-py-xs">
      <ColorPicker
        @selected="(color: string) => $emit('highlightText', color)"
      />
      <q-btn
        class="q-ml-sm"
        dense
        flat
        :ripple="false"
        size="md"
        padding="none"
        icon="content_copy"
        @click="copyText"
        data-cy="btn-copy"
      >
        <q-tooltip>{{ $t("copy") }}</q-tooltip>
      </q-btn>
      <q-btn
        v-for="(btn, index) in pluginBtns"
        :key="index"
        class="q-ml-sm"
        dense
        flat
        :ripple="false"
        size="md"
        padding="none"
        :icon="btn.icon"
        @click="onPluginBtnClick(btn)"
      >
        <q-tooltip>{{ btn.tooltip }}</q-tooltip>
      </q-btn>
    </div>
    <div
      v-for="(view, index) in pluginViews"
      :key="index"
    >
      <FloatingMenuView
        v-if="stateStore.showPDFMenuView && view.buttonId == clickedBtnId"
        :view="view"
      ></FloatingMenuView>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ComponentName, ToggleButton } from "src/backend/database";
import { copyToClipboard } from "quasar";
import ColorPicker from "./ColorPicker.vue";
import FloatingMenuView from "./FloatingMenuView.vue";
import pluginManager from "src/backend/plugin";
import { Button, View } from "src/backend/database";
import { useStateStore } from "src/stores/appState";
defineEmits(["highlightText"]);

const stateStore = useStateStore();
const pluginBtns = ref<Button[]>([]);
const pluginToggleBtns = ref<ToggleButton[]>([]);
const pluginViews = ref<View[]>([]);
const clickedBtnId = ref("");

function copyText() {
  let selection = window.getSelection();
  if (selection) copyToClipboard(selection.toString());
}

function onPluginBtnClick(button: Button) {
  clickedBtnId.value = button.id;
  button.click();
}

watch(pluginManager.statusMap.value, (_) => {
  pluginViews.value = pluginManager.getViews(ComponentName.PDF_MENU);
  let buttons = pluginManager.getBtns(ComponentName.PDF_MENU);
  pluginBtns.value = buttons.btns;
  pluginToggleBtns.value = buttons.toggleBtns;
});

onMounted(() => {
  pluginViews.value = pluginManager.getViews(ComponentName.PDF_MENU);
  let buttons = pluginManager.getBtns(ComponentName.PDF_MENU);
  pluginBtns.value = buttons.btns;
});

onBeforeUnmount(() => {
  stateStore.togglePDFMenuView(false);
});
</script>
