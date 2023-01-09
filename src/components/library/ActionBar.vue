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
    <q-dialog v-model="showDialog">
      <q-card square>
        <q-card-section>
          <div class="text-h6">Create Entry By Identifier</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-input
            outlined
            square
            dense
            autofocus
            class="full-width"
            placeholder="DOI, ISBN, Arxiv ID, etc ..."
            v-model="identifier"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            v-close-popup
            :ripple="false"
            label="Cancel"
          />
          <q-btn
            flat
            v-close-popup
            :ripple="false"
            label="Confirm"
            @click="addByID"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

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
            @click="addProject()"
          >
            <q-item-section>Create Empty Entry</q-item-section>
          </q-item>
          <q-item
            clickable
            v-close-popup
            @click="showDialog = true"
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
import { addProject, updateProject } from "src/backend/project/project";
import { copyFile } from "src/backend/project/file";
import { getMeta } from "src/backend/project/meta";

export default {
  props: { rightMenuSize: Number },
  emits: ["toggleRightMenu", "addProject"],

  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  data() {
    return {
      searchString: "",

      showRightMenu: false,

      showDialog: false,
      identifier: "",
    };
  },

  watch: {
    rightMenuSize(size) {
      this.showRightMenu = size > 0;
    },
  },

  methods: {
    async addProject() {
      this.$emit(
        "addProject",
        await addProject(this.stateStore.selectedFolderId)
      );
    },

    async addByFiles(files) {
      for (let file of files) {
        let project = await addProject(this.stateStore.selectedFolderId);
        project.path = copyFile(file.path, project._id);
        project = await updateProject(project);
        this.$emit("addProject", project);
      }
    },

    async addByID() {
      let project = await addProject(this.stateStore.selectedFolderId);
      let metas = await getMeta(this.identifier);
      let meta = metas[0];
      project.type = meta.type || "";
      project.title = meta.title || "";
      project.author = meta.author || [];
      project.abstract = meta.abstract || "";
      project.DOI = meta.DOI || "";
      project.URL = meta.URL || "";
      project.publisher = meta.publisher || "";
      project = await updateProject(project);

      this.$emit("addProject", project);
    },
  },
};
</script>

<style></style>
