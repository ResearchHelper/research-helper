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
          square
          :options="themeOptions"
          :display-value="theme[0].toUpperCase() + theme.slice(1)"
          v-model="theme"
        >
          <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section>
                <q-item-label>
                  {{ scope.opt[0].toUpperCase() + scope.opt.slice(1) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
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
          square
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
          @click="showFolderPicker(true)"
        >
          <template v-slot:before>
            <div style="font-size: 1rem">{{ $t("storage-path") }}</div>
          </template>
        </q-input>
      </q-card-section>
    </q-card>

    <q-card
      square
      bordered
      flat
      class="q-my-md card"
    >
      <q-card-section class="row">
        <div class="text-h6">{{ $t("export-database") }}</div>
        <q-btn
          class="q-ml-sm"
          unelevated
          square
          no-caps
          color="primary"
          :ripple="false"
          :label="$t('export-database')"
          :disable="disableExportBtn"
          @click="() => exportAsSophosiaDB()"
        >
        </q-btn>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <p>
          <span v-html="$t('export-database-explain')"></span>
          <a
            href="https://sophosia.app"
            target="_blank"
            @click.prevent="openURL('https://sophosia.app')"
            >{{ " " + $t("what-is-sophosia") }}</a
          >
        </p>
        <q-input
          dense
          outlined
          square
          readonly
          input-style="cursor: pointer; font-size: 1rem"
          v-model="newStoragePath"
          :placeholder="$t('select-new-path')"
          @click="showFolderPicker(false)"
        >
          <template v-slot:before>
            <div style="font-size: 1rem">{{ $t("new-storage-path") }}</div>
          </template>
        </q-input>
      </q-card-section>
    </q-card>

    <q-card
      square
      bordered
      flat
      class="q-my-md card"
    >
      <q-card-section>
        <div class="row">
          <div class="text-h6">{{ $t("citation-key") }}</div>
          <q-btn
            class="q-ml-sm"
            unelevated
            square
            no-caps
            color="primary"
            :ripple="false"
            :label="$t('update-references')"
            @click="updateCiteKeys"
          ></q-btn>
        </div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <div
          v-for="(meta, index) in exampleMetas"
          :key="index"
        >
          {{ `Example${index + 1} -- ${citeKeyExample(meta)}` }}
        </div>
        <div class="row">
          <q-select
            dense
            outlined
            square
            :options="citeKeyPartKeyOptions"
            :display-value="$t(citeKeyPartKeys[0])"
            :option-label="(opt) => $t(opt)"
            v-model="citeKeyPartKeys[0]"
            @update:model-value="updateCiteKeyRule"
          />
          <q-select
            dense
            outlined
            square
            :options="citeKeyConnectorOptions"
            v-model="citeKeyConnector"
            :option-label="(opt) => $t(opt)"
            @update:model-value="updateCiteKeyRule"
          />
          <q-select
            dense
            outlined
            square
            :options="citeKeyPartKeyOptions"
            :display-value="$t(citeKeyPartKeys[1])"
            :option-label="(opt) => $t(opt)"
            v-model="citeKeyPartKeys[1]"
            @update:model-value="updateCiteKeyRule"
          />
          <q-select
            dense
            outlined
            square
            :options="citeKeyConnectorOptions"
            v-model="citeKeyConnector"
            :option-label="(opt) => $t(opt)"
            @update:model-value="updateCiteKeyRule"
          />
          <q-select
            dense
            outlined
            square
            :options="citeKeyPartKeyOptions"
            :display-value="$t(citeKeyPartKeys[2])"
            :option-label="(opt) => $t(opt)"
            v-model="citeKeyPartKeys[2]"
            @update:model-value="updateCiteKeyRule"
          />
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>
<script setup lang="ts">
// types
import { computed, reactive, ref } from "vue";
import { Project, Note, Meta } from "src/backend/database";
import ProgressDialog from "./ProgressDialog.vue";
// db
import { useStateStore } from "src/stores/appState";
import { updateAppState } from "src/backend/appState";
import { changePath } from "src/backend/project/file";
import { getAllProjects } from "src/backend/project/project";
import { getAllNotes } from "src/backend/project/note";
import { generateCiteKey } from "src/backend/project/meta";
import { db } from "src/backend/database";
import { useI18n } from "vue-i18n";
import { exportDB } from "src/backend/export/sophosiadb";
import pluginManager from "src/backend/plugin";

const stateStore = useStateStore();
const { locale } = useI18n({ useScope: "global" });

// progressDialog
const showProgressDialog = ref(false);
const errors = ref<Error[]>([]);
const progress = ref(0.0);

// export sophosia db
const newStoragePath = ref("");
const disableExportBtn = ref(false);

// options
const languageOptions = [
  { value: "en_US", label: "English (en_US)" },
  { value: "zh_CN", label: "中文 (zh_CN)" },
];
const themeOptions = ["dark", "light"];
const citeKeyPartKeyOptions = ["author", "title", "year"];
const citeKeyConnectorOptions = [" ", "_", "-", "."];

// example metas
const exampleMetas = [
  {
    title: "A Long Title",
    author: [{ family: "Last", given: "First" }],
    issued: { "date-parts": [[2023]] },
  },
  {
    title: "A Long Title",
    author: [
      { family: "Last1", given: "First1" },
      { family: "Last2", given: "First2" },
    ],
    issued: { "date-parts": [[2023]] },
  },
  {
    title: "A Long Title",
    author: [
      { family: "Last1", given: "First1" },
      { family: "Last2", given: "First2" },
      { family: "Last3", given: "First3" },
    ],
    issued: { "date-parts": [[2023]] },
  },
] as Meta[];

const language = computed({
  get() {
    let result = languageOptions[0];
    for (let option of languageOptions) {
      if (option.value === stateStore.settings.language) {
        result = option;
      }
    }
    return result;
  },
  set(option: { value: string; label: string }) {
    locale.value = option.value;
    stateStore.changeLanguage(option.value);
  },
});

const theme = computed({
  get() {
    return stateStore.settings.theme;
  },
  set(option: string) {
    stateStore.changeTheme(option);
  },
});

const fontSize = computed({
  get() {
    return parseFloat(stateStore.settings.fontSize);
  },
  set(size: number) {
    stateStore.changeFontSize(size);
  },
});

// citeKeyRule = "author<connector>title<connector>year"
// stateStore.settings.citeKeyRule.split(/[^a-z]/) => ["author", "title", "year"]
const citeKeyPartKeys = reactive(
  stateStore.settings.citeKeyRule.split(/[^a-z]/)
);
// stateStore.settings.citeKeyRule.split(/[a-z]/).filter((s) => s) => [ connector, connector ]
const citeKeyConnector = ref(
  stateStore.settings.citeKeyRule.split(/[a-z]/).filter((s) => s)[0]
);

/*********************
 * Methods
 *********************/
/**
 * Show folder picker so user can select a new folder
 * only change the path when changePath=true
 * other only set newStoragePath.value
 * so that the newStoragePath select can be used in exportDB section
 * @param changePath
 */
async function showFolderPicker(changePath: boolean) {
  let result = window.fileBrowser.showFolderPicker();
  if (result !== undefined && !!result[0]) {
    let storagePath = result[0]; // do not update texts in label yet
    if (changePath) await changeStoragePath(storagePath);
    else {
      newStoragePath.value = storagePath;
      disableExportBtn.value = false;
    }
  }
}

async function changeStoragePath(newStoragePath: string) {
  // update db
  let oldStoragePath = stateStore.settings.storagePath;
  stateStore.settings.storagePath = newStoragePath;
  await saveAppState();
  await moveFiles(oldStoragePath, newStoragePath);
  pluginManager.changePath(newStoragePath);
  await pluginManager.reloadAll(); // reload plugins
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

async function exportAsSophosiaDB() {
  if (!newStoragePath.value) return;
  showProgressDialog.value = true;
  await exportDB(newStoragePath.value, (prog) => {
    progress.value = prog;
  });
  disableExportBtn.value = true;
}

function citeKeyExample(meta: Meta) {
  return `title: ${meta.title}, year: ${
    (meta.issued as { "date-parts": any })["date-parts"][0][0]
  }, authors: ${meta.author
    .map((name) => name.given + " " + name.family)
    .join(", ")} => ${generateCiteKey(meta, stateStore.settings.citeKeyRule)}`;
}

function updateCiteKeyRule() {
  stateStore.settings.citeKeyRule = citeKeyPartKeys.join(
    citeKeyConnector.value
  );
  saveAppState();
}

async function updateCiteKeys() {
  let projects = await getAllProjects();
  for (let project of projects)
    project["citation-key"] = generateCiteKey(
      project,
      stateStore.settings.citeKeyRule
    );
  await db.bulkDocs(projects);
}

async function saveAppState() {
  let state = stateStore.saveState();
  await updateAppState(state);
}

function openURL(url: string) {
  window.browser.openURL(url);
}
</script>

<style scoped>
.card {
  background: var(--color-settings-card-bkgd);
}
</style>
