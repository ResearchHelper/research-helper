<template>
  <q-carousel
    v-if="modelValue"
    model-value="start"
    style="height: 100vh"
  >
    <q-carousel-slide
      name="start"
      class="column no-wrap flex-center"
    >
      <h2 data-cy="title">
        {{ $t("welcome-to-research-helper") }}
        <q-icon class="q-ml-lg">
          <img
            src="~assets/logo.svg"
            alt="logo"
          />
        </q-icon>
      </h2>
      <div></div>

      <div class="text-h5">
        {{ $t("select-a-folder-to-fill-up-your-knowledge") }}
      </div>
      <q-input
        style="width: 60%"
        dense
        outlined
        readonly
        v-model="path"
        @click="changeStoragePath"
      >
        <template v-slot:append>
          <q-btn
            flat
            :ripple="false"
            :label="$t('browse')"
            @click="changeStoragePath"
          />
        </template>
      </q-input>
      <q-select
        dense
        outlined
        class="q-mt-xl"
        v-model="language"
        :options="languageOptions"
        data-cy="language-select"
      />
      <q-btn
        unelevated
        :disable="!path"
        square
        :color="path ? 'primary' : 'grey'"
        size="xl"
        class="q-mt-xl"
        :ripple="false"
        :label="$t('start')"
        @click="start"
      />
    </q-carousel-slide>
  </q-carousel>
</template>
<script setup lang="ts">
import { ref, computed } from "vue";
import { useStateStore } from "src/stores/appState";
import { useI18n } from "vue-i18n";
const { locale } = useI18n({ useScope: "global" });

const props = defineProps({ modelValue: { type: Boolean, required: true } });
const emit = defineEmits(["update:modelValue"]);

const stateStore = useStateStore();

const path = ref("");
const languageOptions = ref([
  { value: "en_US", label: "English (en_US)" },
  { value: "zh_CN", label: "中文 (zh_CN)" },
]);

const language = computed({
  get() {
    let result = null;
    for (let option of languageOptions.value) {
      if (option.value === stateStore.settings.language) {
        result = option;
      }
    }
    return result as { value: "en_US" | "zh_CN"; label: string };
  },
  set(option: { value: "en_US" | "zh_CN"; label: string }) {
    locale.value = option.value;
    stateStore.changeLanguage(option.value);
  },
});

function changeStoragePath() {
  let result = window.fileBrowser.showFolderPicker();
  if (result !== undefined && !!result[0]) {
    path.value = result[0];
    stateStore.settings.storagePath = path.value;
    stateStore.saveAppState();
  }
}

function start() {
  emit("update:modelValue", false);
}
</script>
