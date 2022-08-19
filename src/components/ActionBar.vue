<template>
  <q-toolbar>
    <q-btn
      flat
      dense
      icon="account_tree"
      @click="stateStore.toggleLeftMenu"
    >
    </q-btn>

    <q-file
      :multiple="true"
      :append="false"
      :accept="'.pdf'"
      style="display: none"
      @update:model-value="(files) => stateStore.addProject(files)"
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
      v-model="stateStore.searchString"
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

export default {
  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },
};
</script>

<style></style>
