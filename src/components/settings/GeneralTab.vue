<template>
  <div class="q-pb-md">
    <q-dialog
      persistent
      v-model="showProgressDialog"
    >
      <q-card style="width: 50vw">
        <q-card-section>
          <div class="text-h6">{{ $t("moving-files") }}</div>
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
            {{ $t("files-were-successfully-transfer-to-new-path") }}
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
      class="q-my-md card"
    >
      <q-card-section>
        <div class="text-h6">{{ $t("theme") }}</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-select
          dense
          outlined
          :options="themeOptions"
          v-model="theme"
        />
      </q-card-section>
    </q-card>

    <q-card
      square
      bordered
      flat
      class="q-my-md card"
    >
      <q-card-section>
        <div class="text-h6">{{ $t("font") }}</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <div style="font-size: 1rem">
          {{ $t("font-size-fontsize-px", [fontSize]) }}
        </div>
        <q-slider
          class="col q-pl-md"
          :min="14"
          :max="25"
          markers
          snap
          v-model="fontSize"
        ></q-slider>
      </q-card-section>
    </q-card>

    <q-card
      square
      bordered
      flat
      class="q-my-md card"
    >
      <q-card-section>
        <div class="text-h6">{{ $t("language") }}</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-select
          dense
          outlined
          v-model="language"
          :options="languageOptions"
        />
      </q-card-section>
    </q-card>

    <q-card
      square
      bordered
      flat
      class="q-my-md card"
    >
      <q-card-section>
        <div class="text-h6">{{ $t("storage") }}</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-input
          dense
          outlined
          square
          readonly
          input-style="cursor: pointer; font-size: 1rem"
          v-model="stateStore.settings.storagePath"
          @click="showFolderPicker"
        >
          <template v-slot:before>
            <div style="font-size: 1rem">{{ $t("storage-path") }}</div>
          </template>
        </q-input>
      </q-card-section>
    </q-card>
  </div>
</template>
<script lang="ts">
// types
import { defineComponent } from "vue";
import { Project, Note } from "src/backend/database";
// db
import { useStateStore } from "src/stores/appState";
import { updateAppState } from "src/backend/appState";
import { moveFolder } from "src/backend/project/file";
import { getAllProjects } from "src/backend/project/project";
import { getAllNotes } from "src/backend/project/note";
import { db } from "src/backend/database";

export default defineComponent({
  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  data() {
    return {
      showProgressDialog: false,
      error: null as Error | null,

      progress: 1.0,

      languageOptions: [
        { value: "en_US", label: this.$t("english-en_us") },
        { value: "zh_CN", label: this.$t("zhong-wen-zhcn") },
      ],

      themeOptions: [
        { value: "dark", label: this.$t("dark-default") },
        { value: "light", label: this.$t("light") },
      ],
    };
  },

  computed: {
    language: {
      get() {
        let result = null;
        for (let option of this.languageOptions) {
          if (option.value === this.stateStore.settings.language) {
            result = option;
          }
        }
        return result;
      },
      set(option: { value: "en_US" | "zh_CN"; label: string }) {
        this.stateStore.settings.language = option.value;
        this.changeLanguage(option.value);
      },
    },

    theme: {
      get() {
        let result = null;
        for (let option of this.themeOptions) {
          if (option.value === this.stateStore.settings.theme) {
            result = option;
          }
        }
        return result;
      },
      set(option: { value: "dark" | "light"; label: string }) {
        this.stateStore.settings.theme = option.value;
        this.changeTheme(option.value);
      },
    },

    fontSize: {
      get() {
        return parseFloat(this.stateStore.settings.fontSize);
      },
      set(size: number) {
        this.stateStore.settings.fontSize = `${size}px`;
        this.changeFontSize(size);
      },
    },
  },

  methods: {
    changeFontSize(size: number) {
      document.documentElement.style.fontSize = `${size}px`;
      this.saveAppState();
    },

    changeLanguage(locale: "en_US" | "zh_CN") {
      this.$i18n.locale = locale;
      this.saveAppState();
    },

    changeTheme(theme: "dark" | "light") {
      switch (theme) {
        case "dark":
          this.$q.dark.set(true);
          break;

        case "light":
          this.$q.dark.set(false);
          break;
      }
      this.saveAppState();
    },

    async changePath(newStoragePath: string) {
      // update db
      let oldStoragePath = this.stateStore.settings.storagePath;
      this.stateStore.settings.storagePath = newStoragePath;
      await this.saveAppState();
      await this.moveFiles(oldStoragePath, newStoragePath);
    },

    async showFolderPicker() {
      let result = window.fileBrowser.showFolderPicker();
      if (result !== undefined && !!result[0]) {
        let storagePath = result[0]; // do not update texts in label yet
        await this.changePath(storagePath);
      }
    },

    async moveFiles(oldPath: string, newPath: string) {
      // show progress bar
      this.showProgressDialog = true;

      // move files
      moveFolder(oldPath, newPath);

      // update file paths in db
      let projects = await getAllProjects();
      let notes = await getAllNotes();
      let items: (Project | Note)[] = projects.concat(notes);

      let n = items.length;
      for (let [index, item] of items.entries()) {
        if (!!!item.path) continue;

        item.path = item.path.replace(oldPath, newPath);
        this.progress = index / n;
      }

      try {
        await db.bulkDocs(items);
        this.progress = 1.0;
      } catch (error) {
        this.error = error as Error;
      }
    },

    async saveAppState() {
      let state = this.stateStore.saveState();
      await updateAppState(state);
    },
  },
});
</script>

<style scoped>
.card {
  background: var(--color-settings-card-bkgd);
}
</style>
