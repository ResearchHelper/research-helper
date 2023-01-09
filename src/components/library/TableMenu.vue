<template>
  <q-file
    :multiple="false"
    :append="false"
    :accept="'.pdf'"
    style="display: none"
    @update:model-value="(file) => attachFile(file)"
    ref="filePicker"
  />

  <q-dialog
    persistent
    v-model="warning"
  >
    <q-card>
      <q-card-section>
        <div class="text-h6">Warning</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <div>
          Are you sure you want to delete project "{{ row.title }}" from
          database ?
        </div>
        <div>Notes in this project will be deleted too.</div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          flat
          v-close-popup
          :ripple="false"
          >Cancel</q-btn
        >
        <q-btn
          flat
          v-close-popup
          :ripple="false"
          @click="deleteItem(true)"
          >Confirm</q-btn
        >
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-menu
    touch-position
    context-menu
  >
    <q-list dense>
      <q-item
        clickable
        v-close-popup
        @click="openItem"
      >
        <q-item-section>Open</q-item-section>
      </q-item>
      <q-separator />
      <q-item
        clickable
        v-close-popup
        @click="copyItemId"
      >
        <q-item-section>Copy Item ID</q-item-section>
      </q-item>
      <q-separator />

      <q-item clickable>
        <q-item-section>
          {{ !!row.path ? "Replace File" : "Attach File" }}
        </q-item-section>
        <q-item-section side>
          <q-icon name="arrow_right" />
        </q-item-section>
        <q-menu
          anchor="top end"
          self="top start"
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
        @click="warning = true"
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
  emits: ["openItem", "deleteItem", "deleteItemFromDB", "attachFile"],

  data() {
    return {
      replaceStoredCopy: false,
      warning: false,
    };
  },

  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  methods: {
    openItem() {
      this.$emit("openItem", this.row);
    },

    copyItemId() {
      copyToClipboard(this.row._id);
    },

    deleteItem(deleteFromDB) {
      if (deleteFromDB) {
        this.$emit("deleteItemFromDB", this.row);
      } else {
        this.$emit("deleteItem", this.row);
      }
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
      if (this.replaceStoredCopy) dstPath = copyFile(file.path, this.row._id);
      let row = await getProject(this.row._id);
      row.path = dstPath;
      row = await updateProject(row);
      this.$emit("attachFile", row);
    },
  },
};
</script>
