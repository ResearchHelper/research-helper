<template>
  <div
    v-if="loading"
    style="margin-top: 50vh"
    class="q-px-xl row justify-center"
  >
    <div class="text-h6">{{ $t("loading") + "..." }}</div>
    <q-linear-progress
      v-if="loading"
      size="1.5rem"
      color="primary"
      :value="1"
    >
      <div class="absolute-full flex flex-center">
        <q-badge
          color="white"
          text-color="primary"
          label="100%"
        />
      </div>
    </q-linear-progress>
  </div>
  <WelcomeCarousel
    v-else-if="showWelcomeCarousel"
    v-model="showWelcomeCarousel"
    @updateAppState="saveAppState"
  />
  <MainLayout
    v-else
    @updateAppState="saveAppState"
  />
</template>
<script setup lang="ts">
import WelcomeCarousel from "src/components/WelcomeCarousel.vue";
import MainLayout from "./MainLayout.vue";

import { useQuasar } from "quasar";
import { getAppState, updateAppState } from "src/backend/appState";
import { useStateStore } from "src/stores/appState";
import { useProjectStore } from "src/stores/projectStore";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
const $q = useQuasar();
const { locale } = useI18n({ useScope: "global" });
const stateStore = useStateStore();
const projectStore = useProjectStore();
// must determine the existence of storagePath before heading to MainLayout
const showWelcomeCarousel = ref(true);
const loading = ref(true);

onMounted(async () => {
  // show progress bar during appState retrival
  setTimeout(() => {
    loading.value = false;
  }, 500);
  let state = await getAppState();
  stateStore.loadState(state);
  projectStore.loadOpenedProjects(state.openedProjectIds);

  // if there is no path, show welcome carousel
  if (!stateStore.settings.storagePath) {
    showWelcomeCarousel.value = true;
  } else {
    showWelcomeCarousel.value = false;
  }

  // apply settings
  changeTheme(stateStore.settings.theme);
  changeLanguage(stateStore.settings.language);
  changeFontSize(stateStore.settings.fontSize);
});

/***************************
 * Load and apply settings
 ***************************/
function changeTheme(theme: string) {
  switch (theme) {
    case "dark":
      $q.dark.set(true);
      break;

    case "light":
      $q.dark.set(false);
      break;
  }
}

function changeLanguage(language: string) {
  locale.value = language;
}

function changeFontSize(fontSize: string) {
  document.documentElement.style.fontSize = fontSize;
}

async function saveAppState() {
  let state = stateStore.saveState();
  state.openedProjectIds = projectStore.openedProjects.map(
    (project) => project._id
  );
  await updateAppState(state);
}
</script>
