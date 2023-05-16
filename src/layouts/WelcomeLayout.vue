<template>
  <WelcomeCarousel v-model="showWelcomeCarousel" />
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";
import WelcomeCarousel from "src/components/WelcomeCarousel.vue";
import { getAppState } from "src/backend/appState";
import { useQuasar } from "quasar";
import { useI18n } from "vue-i18n";
import { useStateStore } from "src/stores/appState";
const stateStore = useStateStore();
const $q = useQuasar();
const { locale } = useI18n({ useScope: "global" });
const showWelcomeCarousel = ref(false);

onMounted(async () => {
  let state = await getAppState();
  stateStore.loadState(state);

  // if there is no path, show welcome carousel
  if (!stateStore.settings.storagePath) {
    showWelcomeCarousel.value = true;
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
</script>
