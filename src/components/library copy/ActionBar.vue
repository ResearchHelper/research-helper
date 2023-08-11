<template>
  <q-toolbar class="q-px-none">
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
            @click="addByFiles('file')"
          >
            <q-item-section>{{ $t("create-entry-by-file") }}</q-item-section>
          </q-item>
          <q-separator />
          <q-item
            clickable
            v-close-popup
            @click="addByFiles('collection')"
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
      v-model="searchText"
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
      v-model="stateStore.showLibraryRightMenu"
      clearable
      flat
      dense
      square
      size="0.8rem"
      padding="none"
      :ripple="false"
      toggle-color="primary"
      :options="[{ value: true, icon: 'list' }]"
    >
      <q-tooltip>{{ $t("info") }}</q-tooltip>
    </q-btn-toggle>
  </q-toolbar>
</template>

<script setup lang="ts">
// types
import { computed } from "vue";
import { debounce } from "quasar";
import { useStateStore } from "src/stores/appState";

const stateStore = useStateStore();

const props = defineProps({
  searchString: { type: String, required: true },
});
const emit = defineEmits([
  "update:searchString",
  "addEmptyProject",
  "addByFiles",
  "addByCollection",
  "showIdentifierDialog",
  "refreshTable",
]);

const searchText = computed({
  get() {
    return props.searchString;
  },
  set: debounce((text: string) => {
    emit("update:searchString", text);
  }, 500),
});

async function addByFiles(type: string) {
  let filePaths: string[] | undefined;
  switch (type) {
    case "file":
      filePaths = window.fileBrowser.showFilePicker({
        multiSelections: true,
        filters: [{ name: "*.pdf", extensions: ["pdf"] }],
      });
      if (!filePaths) return;
      emit("addByFiles", filePaths);
      break;
    case "collection":
      filePaths = window.fileBrowser.showFilePicker({
        multiSelections: false,
        filters: [
          { name: "*.bib, *.ris, *.json", extensions: ["bib", "ris", "json"] },
        ],
      });
      if (!filePaths) return;
      emit("addByCollection", filePaths[0]);
      break;
  }
}

function addEmpty() {
  emit("addEmptyProject");
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
