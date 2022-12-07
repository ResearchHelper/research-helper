<template>
  <q-toolbar class="q-px-none">
    <q-file
      :multiple="true"
      :append="false"
      :accept="'.pdf'"
      style="display: none"
      @update:model-value="(files) => addRows(files)"
      ref="filePicker"
    />
    <q-btn
      flat
      dense
      icon="add"
      @click="$refs.filePicker.$el.click()"
    >
    </q-btn>

    <q-space />

    <q-input
      outlined
      dense
      v-model="projectStore.searchString"
      placeholder="Search"
    >
      <template v-slot:append>
        <q-icon
          class="cursor-pointer"
          name="search"
        />
      </template>
    </q-input>

    <q-space />

    <q-btn
      flat
      dense
      icon="list"
      @click="stateStore.toggleInfoPane"
    >
    </q-btn>
  </q-toolbar>
</template>

<script>
import { useStateStore } from "src/stores/appState";
import { useProjectStore } from "src/stores/projectStore";

export default {
  setup() {
    const stateStore = useStateStore();
    const projectStore = useProjectStore();
    return { stateStore, projectStore };
  },

  methods: {
    async addRows(files) {
      for (let file of files) {
        await this.projectStore.add(file);
      }
    },
  },
};
</script>

<style></style>
