<template>
  <q-toolbar class="q-px-none">
    <q-file
      :multiple="true"
      :append="false"
      :accept="'.pdf'"
      style="display: none"
      @update:model-value="(files) => addByFiles(files)"
      ref="filePicker"
    />

    <q-btn
      flat
      dense
      square
      icon="add"
    >
      <q-menu>
        <q-list dense>
          <q-item
            clickable
            v-close-popup
            @click="addEmpty"
          >
            <q-item-section>Create Empty Entry</q-item-section>
          </q-item>
          <q-item
            clickable
            v-close-popup
            @click="addByID"
          >
            <q-item-section>Create Entry By Identifier</q-item-section>
          </q-item>
          <q-item
            clickable
            v-close-popup
            @click="$refs.filePicker.$el.click()"
          >
            <q-item-section>Create Entry By File</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>

    <q-space />

    <q-input
      outlined
      dense
      placeholder="Search"
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
      :ripple="false"
      toggle-color="primary"
      :options="[{ value: true, icon: 'list' }]"
      @update:model-value="$emit('toggleRightMenu', showRightMenu)"
    />
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
    "showIdentifierDialog",
  ],

  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  data() {
    return {
      showRightMenu: false,
    };
  },

  watch: {
    rightMenuSize(size) {
      this.showRightMenu = size > 0;
    },
  },

  methods: {
    addEmpty() {
      this.$emit("addEmptyProject");
    },

    addByFiles(files) {
      this.$emit("addByFiles", files);
    },

    addByID() {
      this.$emit("showIdentifierDialog");
    },
  },
};
</script>

<style></style>
