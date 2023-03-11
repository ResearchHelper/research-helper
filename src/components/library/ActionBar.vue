<template>
  <q-toolbar class="q-px-none">
    <q-file
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

<script>
import { useStateStore } from "src/stores/appState";

export default {
  props: { rightMenuSize: Number, searchString: String },
  emits: [
    "update:searchString",
    "toggleRightMenu",
    "addEmptyProject",
    "addByFiles",
    "addByCollection",
    "showIdentifierDialog",
    "refreshTable",
  ],

  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  data() {
    return {
      showRightMenu: false,
      multiple: true,
      accept: "",
      fileType: "",
    };
  },

  watch: {
    rightMenuSize(size) {
      this.showRightMenu = size > 0;
    },
  },

  methods: {
    async showFilePicker(fileType) {
      switch (fileType) {
        case "file":
          this.multiple = true;
          this.accept = ".pdf";
          break;

        case "collection":
          this.multiple = false;
          this.accept = ".bib, .ris, .json";
          break;
      }
      this.fileType = fileType;
      await this.$nextTick(); // wait until the acceptType is set
      this.$refs.filePicker.$el.click();
    },

    addEmpty() {
      this.$emit("addEmptyProject");
    },

    addByFiles(file) {
      switch (this.fileType) {
        case "file":
          // in this case, file is an array of File objects
          this.$emit("addByFiles", file);
          break;

        case "collection":
          this.$emit("addByCollection", file);
          break;
      }
    },

    addByID() {
      this.$emit("showIdentifierDialog");
    },
  },
};
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
