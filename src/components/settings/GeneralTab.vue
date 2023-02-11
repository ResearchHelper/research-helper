<template>
  <div class="q-pb-md">
    <q-dialog
      persistent
      v-model="showProgressDialog"
    >
      <q-card style="width: 50vw">
        <q-card-section>
          <div class="text-h6">Moving Files</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-linear-progress
            size="1rem"
            :value="progress"
          >
            <div class="absolute-full flex flex-center">
              <q-badge color="transparent">
                {{ Math.round(progress * 100) }} %
              </q-badge>
            </div>
          </q-linear-progress>
          <div class="text-negative">{{ error }}</div>
          <div v-show="progress > 0.999">
            Files were successfully transfer to new path.
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            :disable="progress < 0.999 && !!!error"
            :ripple="false"
            label="OK"
            v-close-popup
          >
          </q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-card
      square
      bordered
      flat
      class="q-my-md"
    >
      <q-card-section>
        <div class="text-h6">Theme</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-select
          dense
          outlined
          :options="themeOptions"
          v-model="theme"
          @update:model-value="(option) => changeTheme(option.value)"
        />
      </q-card-section>
    </q-card>

    <q-card
      square
      bordered
      flat
      class="q-my-md"
    >
      <q-card-section>
        <div class="text-h6">Font</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <div style="font-size: 1rem">Font size: {{ textsize }}px</div>
        <q-slider
          class="col q-pl-md"
          :min="14"
          :max="25"
          markers
          snap
          v-model="textsize"
          @update:model-value="(textsize) => changeFontSize(textsize)"
        ></q-slider>
      </q-card-section>
    </q-card>

    <q-card
      square
      bordered
      flat
      class="q-my-md"
    >
      <q-card-section>
        <div class="text-h6">Language</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-select
          dense
          outlined
          v-model="language"
          :options="languageOptions"
          @update:model-value="changeLanguage"
        />
      </q-card-section>
    </q-card>

    <q-card
      square
      bordered
      flat
      class="q-my-md"
    >
      <q-card-section>
        <div class="text-h6">Storage</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-input
          dense
          outlined
          square
          readonly
          input-style="cursor: pointer; font-size: 1rem"
          v-model="storagePath"
          @click="showFolderPicker"
        >
          <template v-slot:before>
            <div style="font-size: 1rem">Storage path:</div>
          </template>
        </q-input>
      </q-card-section>
    </q-card>
  </div>
</template>
<script>
import { useQuasar, dom } from "quasar";
import { useStateStore } from "src/stores/appState";
import { updateAppState } from "src/backend/appState";
import { moveFolder } from "src/backend/project/file";
import { getAllProjects } from "src/backend/project/project";
import { getAllNotes } from "src/backend/project/note";
import { db } from "src/backend/database";

export default {
  setup() {
    const $q = useQuasar();
    const stateStore = useStateStore();
    return { stateStore };
  },

  data() {
    return {
      showProgressDialog: false,
      error: "",

      progress: 1.0,
      textsize: 16,
      storagePath: this.stateStore.storagePath,

      languageOptions: [
        { value: "en_US", label: "English (en_US)" },
        { value: "zh_CN", label: "中文 (zh_CN)" },
      ],
      language: { value: "en_US", label: "English (en_US)" },

      themeOptions: [
        { value: "dark", label: "Dark (Default)" },
        { value: "light", label: "Light" },
      ],
      theme: { value: "dark", label: "Dark" },
    };
  },

  methods: {
    changeFontSize(size) {
      document.documentElement.style.fontSize = size + "px";
    },

    changeTheme(theme) {
      let colors = {};
      switch (theme) {
        case "dark":
          this.$q.dark.set(true);
          colors = {
            "--color-layout-active-tab-bkgd": "#2a2a2a",
            "--color-layout-active-tab-fore": "#dddddd",
            "--color-layout-focused-tab-bkgd": "#1d1d1d",
            "--color-layout-single-tab-container-fore": "#999999",
            "--color-layout-single-tab-container-bkgd": "#2a2a2a",
            "--color-layout-header-bkgd": "#222121",
          };
          break;

        case "light":
          this.$q.dark.set(false);
          colors = {
            "--color-layout-active-tab-bkgd": "white",
            "--color-layout-active-tab-fore": "black",
            "--color-layout-focused-tab-bkgd": "white",
            "--color-layout-single-tab-container-fore": "black",
            "--color-layout-single-tab-container-bkgd": "darkgrey",
            "--color-layout-header-bkgd": "grey",
          };
          break;
      }
      for (let k in colors) {
        document.documentElement.style.setProperty(k, colors[k]);
      }
    },

    changeLanguage(option) {
      this.$i18n.locale = option.value;
    },

    async showFolderPicker() {
      let result = window.folderPicker.show();
      if (result !== undefined && !!result[0]) {
        this.storagePath = result[0]; // do not update texts in label yet
        await this.changePath();
      }
    },

    async changePath() {
      // update db
      this.oldStoragePath = this.stateStore.storagePath;
      this.stateStore.storagePath = this.storagePath;
      let state = this.stateStore.saveState();
      await updateAppState(state);
      await this.moveFiles();
    },

    async moveFiles() {
      // show progress bar
      this.showProgressDialog = true;

      // move files
      moveFolder(this.oldStoragePath, this.stateStore.storagePath);

      // update file paths in db
      let projects = await getAllProjects();
      let notes = await getAllNotes();
      let items = projects.concat(notes);

      let n = items.length;
      for (let [index, item] of items.entries()) {
        if (!!!item.path) continue;

        item.path = item.path.replace(
          this.oldStoragePath,
          this.stateStore.storagePath
        );
        this.progress = index / n;
      }

      try {
        await db.bulkDocs(items);
        this.progress = 1.0;
      } catch (error) {
        this.error = error;
      }
    },
  },
};
</script>
