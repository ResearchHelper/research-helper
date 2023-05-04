<template>
  <q-toolbar class="q-px-none">
    <q-file
      v-model="files"
      :multiple="multiple"
      :accept="accept"
      :append="false"
      style="display: none"
      @update:model-value="(files) => addByFiles(files)"
      ref="filePicker"
    />

    <q-btn
      flat
      dense
      square
      icon="add"
      size="0.8rem"
      padding="none"
    >
      <q-tooltip>{{ $t("add-project") }}</q-tooltip>
      <q-menu square>
        <q-list dense>
          <q-item
            clickable
            v-close-popup
            @click="addEmpty"
          >
            <q-item-section>{{ $t("create-empty-entry") }}</q-item-section>
          </q-item>
          <q-item
            clickable
            v-close-popup
            @click="addByID"
          >
            <q-item-section>{{
              $t("create-entry-by-identifier")
            }}</q-item-section>
          </q-item>
          <q-item
            clickable
            v-close-popup
            @click="showFilePicker('file')"
          >
            <q-item-section>{{ $t("create-entry-by-file") }}</q-item-section>
          </q-item>
          <q-separator />
          <q-item
            clickable
            v-close-popup
            @click="showFilePicker('collection')"
          >
            <q-item-section>
              {{ $t("import-collection-bib-ris-etc") }}
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>

    <q-btn
      flat
      dense
      square
      icon="refresh"
      size="0.8rem"
      padding="none"
      @click="$emit('refreshTable')"
    >
      <q-tooltip>{{ $t("refresh") }}</q-tooltip>
    </q-btn>

    <q-space />

    <q-input
      outlined
      dense
      square
      class="actionbar-input"
      :placeholder="$t('local-search')"
      :model-value="searchString"
      @update:model-value="
        (text) => {
          $emit('update:searchString', text);
        }
      "
    >
      <template v-slot:append>
        <q-icon
          class="cursor-pointer"
          name="search"
        />
      </template>
    </q-input>

    <q-space />

    <q-btn-toggle
      v-model="showRightMenu"
      clearable
      flat
      dense
      square
      size="0.8rem"
      padding="none"
      :ripple="false"
      toggle-color="primary"
      :options="[{ value: true, icon: 'list' }]"
      @update:model-value="$emit('toggleRightMenu', showRightMenu)"
    >
      <q-tooltip>{{ $t("info") }}</q-tooltip>
    </q-btn-toggle>
  </q-toolbar>
</template>

<script setup lang="ts">
// types
import { nextTick, ref, watch } from "vue";
import { QFile } from "quasar";

const props = defineProps({
  rightMenuSize: { type: Number, required: true },
  searchString: String,
});
const emit = defineEmits([
  "update:searchString",
  "toggleRightMenu",
  "addEmptyProject",
  "addByFiles",
  "addByCollection",
  "showIdentifierDialog",
  "refreshTable",
]);

const filePicker = ref<QFile | null>(null);

const showRightMenu = ref(false);
const multiple = ref(true);
const accept = ref("");
const fileType = ref("");
const files = ref<File[]>([]);

watch(
  () => props.rightMenuSize,
  (size: number) => {
    showRightMenu.value = size > 0;
  }
);

async function showFilePicker(type: string) {
  switch (type) {
    case "file":
      multiple.value = true;
      accept.value = ".pdf";
      break;
    case "collection":
      multiple.value = false;
      accept.value = ".bib, .ris, .json";
      break;
  }
  fileType.value = type;
  await nextTick(); // wait until the acceptType is set
  (filePicker.value as QFile).$el.click();
}

function addEmpty() {
  emit("addEmptyProject");
}

function addByFiles(file: File[] | File) {
  switch (fileType.value) {
    case "file":
      // in this case, file is an array of File objects
      emit("addByFiles", file as File[]);
      break;
    case "collection":
      emit("addByCollection", file as File);
      break;
  }
}

function addByID() {
  emit("showIdentifierDialog");
}
</script>
<style lang="scss">
.actionbar-input {
  /* for sizing the q-input */
  .q-field__control {
    height: min(1.8rem, 36px) !important;
  }
  .q-field__marginal {
    height: min(1.8rem, 36px) !important;
  }
}
</style>
