<template>
  <q-tr
    no-hover
    class="cursor-pointer non-selectable"
    @click="clickItem"
    @dblclick="openItem"
  >
    <q-td auto-width></q-td>
    <q-td
      v-if="item.dataType === 'note'"
      colspan="100%"
    >
      <div class="row items-center">
        <q-icon
          style="font-size: 1rem"
          name="bi-file-text-fill"
        />
        <input
          v-if="renaming"
          v-model="label"
          @blur="onRenameNote"
          @keydown.enter="($refs.renameInput as HTMLInputElement).blur()"
          ref="renameInput"
        />
        <div
          v-else
          style="font-size: 1rem"
          class="q-ml-xs"
        >
          {{ label }}
        </div>
      </div>
    </q-td>
    <q-td
      v-else
      colspan="100%"
    >
      <div class="row items-center">
        <q-icon
          style="font-size: 1rem; padding-right: 0.3rem"
          name="bi-file-pdf-fill"
        />
        <div
          class="col"
          style="font-size: 1rem"
        >
          {{ label }}
        </div>
      </div>
    </q-td>

    <q-menu
      touch-position
      context-menu
      square
      auto-close
      transition-duration="0"
    >
      <q-list
        v-if="item.dataType === 'note'"
        dense
      >
        <q-item
          clickable
          @click="copyID"
        >
          <q-item-section>{{ $t("copy-note-id") }}</q-item-section>
        </q-item>

        <q-separator />

        <q-item
          clickable
          @click="openItem"
        >
          <q-item-section>{{ $t("open-note") }}</q-item-section>
        </q-item>
        <q-item
          clickable
          @click="setRenaming"
        >
          <q-item-section>{{ $t("rename-note") }}</q-item-section>
        </q-item>
        <q-item
          clickable
          @click="deleteItem"
        >
          <q-item-section>{{ $t("delete-note") }}</q-item-section>
        </q-item>
      </q-list>

      <q-list
        v-else
        dense
      >
        <q-item
          clickable
          @click="openItem"
        >
          <q-item-section>{{ $t("open-pdf") }}</q-item-section>
        </q-item>

        <q-item
          clickable
          @click="renameFile"
        >
          <q-item-section>{{ $t("rename-pdf-from-metadata") }}</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-tr>
</template>
<script lang="ts">
// types
import { defineComponent, inject, PropType } from "vue";
import { Project, Note } from "src/backend/database";
import {
  KEY_deleteNote,
  KEY_renameFromMeta,
  KEY_renameNote,
} from "./injectKeys";
// db
import { useStateStore } from "src/stores/appState";
import { copyToClipboard } from "quasar";

export default defineComponent({
  props: {
    item: { type: Object as PropType<Project | Note>, required: true },
  },
  emits: ["renameFile"],

  data() {
    return {
      renaming: false,
      newLabel: "",
    };
  },

  computed: {
    // label has to be reactive
    // once this.item.path is changed
    // we also need to change the label
    label: {
      get() {
        let _label = "";
        if (this.item.dataType === "note") {
          _label = this.item.label;
        } else if (this.item.dataType === "project") {
          _label = window.path.basename(this.item.path as string);
        }
        return _label;
      },
      set(newLabel: string) {
        this.newLabel = newLabel;
      },
    },
  },

  setup() {
    const stateStore = useStateStore();
    const renameNote = inject(KEY_renameNote) as (
      note: Note,
      index?: number
    ) => void;
    const deleteNote = inject(KEY_deleteNote) as (
      note: Note,
      index?: number
    ) => void;
    const renameFromMeta = inject(KEY_renameFromMeta) as (
      project: Project,
      index?: number
    ) => void;
    return { stateStore, renameNote, deleteNote, renameFromMeta };
  },

  methods: {
    copyID() {
      copyToClipboard(this.item._id);
    },

    clickItem() {
      this.stateStore.selectedItemId = this.item._id;
    },

    openItem() {
      this.stateStore.openItem(this.item._id);
    },

    setRenaming() {
      this.renaming = true;

      setTimeout(() => {
        let input = this.$refs.renameInput as HTMLInputElement;
        input.focus();
        input.select();
      }, 100);
    },

    onRenameNote() {
      let note = this.item as Note;
      note.label = this.newLabel;
      this.renameNote(note);

      this.renaming = false;
    },

    async deleteItem() {
      this.deleteNote(this.item as Note);
    },

    async renameFile() {
      this.renameFromMeta(this.item as Project);
    },
  },
});
</script>
