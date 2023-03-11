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
          @blur="renameNote"
          @keydown.enter="$refs.renameInput.blur()"
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
      <div class="row">
        <q-icon
          style="font-size: 1rem; padding-right: 0.3rem"
          name="bi-file-pdf-fill"
        />
        <div
          class="col"
          style="font-size: 1rem"
        >
          {{ basename(item.path) }}
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
          <q-item-section>Copy Note ID</q-item-section>
        </q-item>

        <q-separator />

        <q-item
          clickable
          @click="openItem"
        >
          <q-item-section>Open Note</q-item-section>
        </q-item>
        <q-item
          clickable
          @click="setRenaming"
        >
          <q-item-section>Rename Note</q-item-section>
        </q-item>
        <q-item
          clickable
          @click="deleteItem"
        >
          <q-item-section>Delete Note</q-item-section>
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
          <q-item-section>Open PDF</q-item-section>
        </q-item>

        <q-item
          clickable
          @click="renameFile"
        >
          <q-item-section>Rename PDF from Metadata</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-tr>
</template>
<script>
import { useStateStore } from "src/stores/appState";
import { copyToClipboard } from "quasar";

export default {
  props: { item: Object },
  emits: ["renameNote", "deleteNote", "renameFile"],

  data() {
    return {
      renaming: false,
      label: this.item.label,
    };
  },

  setup() {
    const stateStore = useStateStore();
    const basename = window.path.basename;
    return { stateStore, basename };
  },

  methods: {
    copyID() {
      copyToClipboard(this.item._id);
    },

    clickItem() {
      this.stateStore.selectedItemId = this.item._id;
    },

    openItem() {
      this.stateStore.openItemId = this.item._id;
    },

    setRenaming() {
      this.renaming = true;

      setTimeout(() => {
        let input = this.$refs.renameInput;
        input.focus();
        input.select();
      }, 100);
    },

    renameNote() {
      let note = this.item;
      note.label = this.label;
      this.$emit("renameNote", note);

      this.renaming = false;
    },

    async deleteItem() {
      this.$emit("deleteNote", this.item);
    },

    async renameFile() {
      this.$emit("renameFile", this.item);
    },
  },
};
</script>
