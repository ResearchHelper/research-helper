<template>
  <q-menu
    touch-position
    context-menu
    square
    transition-duration="0"
  >
    <q-list dense>
      <q-item
        clickable
        v-close-popup
        @click="copyItemId"
      >
        <q-item-section>{{ $t("copy-project-id") }}</q-item-section>
      </q-item>

      <q-separator />

      <q-item
        v-if="row.dataType === 'project'"
        clickable
        v-close-popup
        @click="addNote"
      >
        <q-item-section> {{ $t("add-note") }} </q-item-section>
      </q-item>
      <q-item
        clickable
        @mouseover="$refs.submenu.show()"
      >
        <q-item-section>
          {{ !!row.path ? $t("replace-file") : $t("attach-file") }}
        </q-item-section>
        <q-item-section side>
          <q-icon name="arrow_right" />
        </q-item-section>
        <q-menu
          square
          anchor="top end"
          self="top start"
          ref="submenu"
        >
          <q-list dense>
            <q-item
              clickable
              v-close-popup
            >
              <q-item-section @click="replaceStoredFileCopy">
                {{
                  !!row.path
                    ? $t("replace-stored-copy-of-file")
                    : $t("attach-stored-copy-of-file")
                }}
              </q-item-section>
            </q-item>
            <q-item
              clickable
              v-close-popup
            >
              <q-item-section @click="replaceLinkToFile">
                {{
                  !!row.path
                    ? $t("replace-path-to-file")
                    : $t("attach-path-to-file")
                }}
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-item>

      <q-separator />
      <q-item
        clickable
        v-close-popup
        @click="openItem"
      >
        <q-item-section>{{ $t("open-project") }}</q-item-section>
      </q-item>

      <q-item
        clickable
        v-close-popup
        @click="showSearchMetaDialog"
      >
        <q-item-section>{{ $t("search-meta-info") }}</q-item-section>
      </q-item>

      <q-item
        v-if="stateStore.selectedFolderId != 'library'"
        clickable
        v-close-popup
        @click="deleteItem(false)"
      >
        <q-item-section>{{ $t("delete-from-folder") }}</q-item-section>
      </q-item>
      <q-item
        clickable
        v-close-popup
        @click="deleteItem(true)"
      >
        <q-item-section>{{ $t("delete-from-database") }}</q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>
<script>
import { copyToClipboard } from "quasar";
import { useStateStore } from "src/stores/appState";

export default {
  props: { row: Object },
  emits: [
    "openItem",
    "deleteItem",
    "deleteItemFromDB",
    "addNote",
    "attachFile",
  ],

  data() {
    return {
      replaceStoredCopy: false,
    };
  },

  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  methods: {
    addNote() {
      this.$emit("addNote", this.row);
    },

    openItem() {
      this.$emit("openItem", this.row);
    },

    copyItemId() {
      copyToClipboard(this.row._id);
    },

    deleteItem(deleteFromDB) {
      this.$bus.emit("showDeleteDialog", this.row, deleteFromDB);
    },

    replaceLinkToFile() {
      let replaceStoredCopy = false;
      this.attachFile(replaceStoredCopy);
    },

    replaceStoredFileCopy() {
      let replaceStoredCopy = true;
      this.attachFile(replaceStoredCopy);
    },

    attachFile(replaceStoredCopy) {
      this.$emit("attachFile", replaceStoredCopy);
    },

    showSearchMetaDialog() {
      this.$bus.emit("showSearchMetaDialog");
    },
  },
};
</script>
