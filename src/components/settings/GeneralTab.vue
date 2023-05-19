<template>
  <div class="q-pb-md">
    <ProgressDialog
      v-model="showProgressDialog"
      :progress="progress"
      :errors="errors"
    />

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
<script setup lang="ts">
// types
import { computed, ref, watch } from "vue";
import { Project, Note } from "src/backend/database";
import ProgressDialog from "./ProgressDialog.vue";
// db
import { useStateStore } from "src/stores/appState";
import { updateAppState } from "src/backend/appState";
import { changePath } from "src/backend/project/file";
import { getAllProjects } from "src/backend/project/project";
import { getAllNotes } from "src/backend/project/note";
import { db } from "src/backend/database";
import { useI18n } from "vue-i18n";
import { useQuasar } from "quasar";

const stateStore = useStateStore();
const { t, locale } = useI18n({ useScope: "global" });
const $q = useQuasar();

// progressDialog
const showProgressDialog = ref(false);
const errors = ref<Error[]>([]);
const progress = ref(0.0);

// options
const languageOptions = ref<{ value: "en_US" | "zh_CN"; label: string }[]>([
  { value: "en_US", label: "English (en_US)" },
  { value: "zh_CN", label: "中文 (zh_CN)" },
]);
const themeOptions = ref<{ value: "dark" | "light"; label: string }[]>([
  { value: "dark", label: t("dark") },
  { value: "light", label: t("light") },
]);

watch(
  () => locale.value,
  () => {
    for (let option of themeOptions.value) {
      option.label = t(option.value);
    }
  }
);

const language = computed({
  get() {
    let result = languageOptions.value[0];
    for (let option of languageOptions.value) {
      if (option.value === stateStore.settings.language) {
        result = option;
      }
    }
    return result;
  },
  set(option: { value: "en_US" | "zh_CN"; label: string }) {
    stateStore.settings.language = option.value;
    changeLanguage(option.value);
  },
});

const theme = computed({
  get() {
    let result = themeOptions.value[0];
    for (let option of themeOptions.value) {
      if (option.value === stateStore.settings.theme) {
        result = option;
      }
    }
    return result;
  },
  set(option: { value: "dark" | "light"; label: string }) {
    stateStore.settings.theme = option.value;
    changeTheme(option.value);
  },
});

const fontSize = computed({
  get() {
    return parseFloat(stateStore.settings.fontSize);
  },
  set(size: number) {
    stateStore.settings.fontSize = `${size}px`;
    changeFontSize(size);
  },
});

/*********************
 * Methods
 *********************/

function changeFontSize(size: number) {
  document.documentElement.style.fontSize = `${size}px`;
  saveAppState();
}

function changeLanguage(_locale: "en_US" | "zh_CN") {
  locale.value = _locale;
  saveAppState();
}

function changeTheme(theme: "dark" | "light") {
  switch (theme) {
    case "dark":
      $q.dark.set(true);
      break;
    case "light":
      $q.dark.set(false);
      break;
  }
  saveAppState();
}

async function showFolderPicker() {
  let result = window.fileBrowser.showFolderPicker();
  if (result !== undefined && !!result[0]) {
    let storagePath = result[0]; // do not update texts in label yet
    await changeStoragePath(storagePath);
  }
}

async function changeStoragePath(newStoragePath: string) {
  // update db
  let oldStoragePath = stateStore.settings.storagePath;
  stateStore.settings.storagePath = newStoragePath;
  await saveAppState();
  await moveFiles(oldStoragePath, newStoragePath);
}

async function moveFiles(oldPath: string, newPath: string) {
  // show progress bar
  showProgressDialog.value = true;
  errors.value = [];

  let projects = (await getAllProjects()) as Project[];
  let notes = (await getAllNotes()) as Note[];
  let total = projects.length + notes.length + 1;
  let current = 0;

  // move hidden folders
  let oldHiddenFolder = window.path.join(oldPath, ".research-helper");
  let newHiddenFolder = window.path.join(newPath, ".research-helper");
  let error = changePath(oldHiddenFolder, newHiddenFolder);
  if (error) errors.value.push(error);
  current++;
  progress.value = current / total;

  // move project folders

  for (let project of projects) {
    if (!!!project.path) continue;
    let oldProjectFolder = window.path.join(oldPath, project._id);
    let newProjectFolder = window.path.join(newPath, project._id);
    let error = changePath(oldProjectFolder, newProjectFolder);
    if (error) errors.value.push(error);
    project.path = project.path.replace(oldPath, newPath);
    current++;
    progress.value = current / total;
  }

  // change note paths
  for (let note of notes) {
    note.path = note.path.replace(oldPath, newPath);
    current++;
    progress.value = current / total;
  }

  try {
    // await db.bulkDocs(items);
    await db.bulkDocs(projects);
    await db.bulkDocs(notes);
    progress.value = 1.0;
  } catch (error) {
    errors.value.push(error as Error);
  }
}

async function saveAppState() {
  let state = stateStore.saveState();
  await updateAppState(state);
}
</script>

<style scoped>
.card {
  background: var(--color-settings-card-bkgd);
}
</style>
