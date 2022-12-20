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
      square
      icon="add"
      @click="$refs.filePicker.$el.click()"
    >
    </q-btn>

    <q-space />

    <q-input
      outlined
      dense
      placeholder="Search"
      v-model="searchString"
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
      v-model="rightMenu"
      clearable
      flat
      dense
      square
      :ripple="false"
      toggle-color="primary"
      :options="[{ value: true, icon: 'list' }]"
    />
  </q-toolbar>
</template>

<script>
import { useStateStore } from "src/stores/appState";
import { addProject } from "src/backend/project/project";

export default {
  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  data() {
    return {
      searchString: "",
    };
  },

  computed: {
    rightMenu: {
      get() {
        return this.stateStore.rightMenuSize > 0;
      },

      set(visible) {
        this.stateStore.currentPage = "library";
        this.stateStore.rightMenuSize = visible ? 25 : 0;
      },
    },
  },

  methods: {
    async addRows(files) {
      for (let file of files) {
        this.$emit("addProject", await addProject(file));
      }
    },
  },
};
</script>

<style></style>
