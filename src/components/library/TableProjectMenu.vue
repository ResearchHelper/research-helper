<template>
  <q-file
    :multiple="false"
    :append="false"
    :accept="'.pdf'"
    style="display: none"
    @update:model-value="(file) => attachFile(file)"
    ref="filePicker"
  />

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
        <q-item-section>Copy Project ID</q-item-section>
      </q-item>

      <q-separator />

      <q-item
        v-if="row.dataType === 'project'"
        clickable
        v-close-popup
        @click="addNote"
      >
        <q-item-section> Add Note </q-item-section>
      </q-item>
      <q-item
        clickable
        @mouseover="$refs.submenu.show()"
      >
        <q-item-section>
          {{ !!row.path ? "Replace File" : "Attach File" }}
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
                    ? "Replace Stored Copy of File"
                    : "Attach Stored Copy of File"
                }}
              </q-item-section>
            </q-item>
            <q-item
              clickable
              v-close-popup
            >
              <q-item-section @click="replaceLinkToFile">
                {{
                  !!row.path ? "Replace Link to File" : "Attach Link to File"
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
        <q-item-section>Open Project</q-item-section>
      </q-item>

      <q-item
        clickable
        v-close-popup
        @click="showSearchMetaDialog"
      >
        <q-item-section>Search Meta Info</q-item-section>
      </q-item>

      <q-item
        v-if="stateStore.selectedFolderId != 'library'"
        clickable
        v-close-popup
        @click="deleteItem(false)"
      >
        <q-item-section>Delete From Folder</q-item-section>
      </q-item>
      <q-item
        clickable
        v-close-popup
        @click="deleteItem(true)"
      >
        <q-item-section>Delete From DataBase</q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>
<script>
import { copyToClipboard } from "quasar";
import { useStateStore } from "src/stores/appState";
import { updateProject, getProject } from "src/backend/project/project";
import { copyFile } from "src/backend/project/file";

export default {
  props: { row: Object },
  emits: [
    "openItem",
    "deleteItem",
    "deleteItemFromDB",
    "attachFile",
    "addNote",
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
      this.replaceStoredCopy = false;
      this.$refs.filePicker.$el.click();
    },

    replaceStoredFileCopy() {
      this.replaceStoredCopy = true;
      this.$refs.filePicker.$el.click();
    },

    /**
     *
     * @param {File} file
     */
    async attachFile(file) {
      let dstPath = file.path;
      if (this.replaceStoredCopy)
        dstPath = await copyFile(file.path, this.row._id);
      let row = await getProject(this.row._id);
      row.path = dstPath;
      row = await updateProject(row);
      this.$emit("attachFile", row);
    },

    showSearchMetaDialog() {
      this.$bus.emit("showSearchMetaDialog");
    },
  },
};
</script>
