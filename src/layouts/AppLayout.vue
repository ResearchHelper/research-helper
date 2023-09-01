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
  />
  <MainLayout v-else />
</template>
<script setup lang="ts">
import WelcomeCarousel from "src/components/WelcomeCarousel.vue";
import MainLayout from "./MainLayout.vue";

import { getAppState } from "src/backend/appState";
import { useStateStore } from "src/stores/appState";
import { useProjectStore } from "src/stores/projectStore";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
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
  stateStore.changeTheme(stateStore.settings.theme);
  stateStore.changeFontSize(parseFloat(stateStore.settings.fontSize));
  stateStore.changeLanguage(stateStore.settings.language);
  locale.value = stateStore.settings.language;
});
</script>
