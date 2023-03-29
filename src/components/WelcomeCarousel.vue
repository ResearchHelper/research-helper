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
      <h2>
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
<script lang="ts">
import { defineComponent } from "vue";
import { useStateStore } from "src/stores/appState";
import { updateAppState } from "src/backend/appState";

export default defineComponent({
  props: { modelValue: Boolean },
  emits: ["update:modelValue"],

  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  data() {
    return {
      path: "",
      languageOptions: [
        { value: "en_US", label: this.$t("english-en_us") },
        { value: "zh_CN", label: this.$t("zhong-wen-zhcn") },
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
  },

  methods: {
    async saveAppState() {
      let state = this.stateStore.saveState();
      await updateAppState(state);
    },

    changeLanguage(locale: "en_US" | "zh_CN") {
      this.$i18n.locale = locale;
      this.saveAppState();
    },

    changeStoragePath() {
      let result = window.fileBrowser.showFolderPicker();
      if (result !== undefined && !!result[0]) {
        this.path = result[0];
        this.stateStore.settings.storagePath = this.path;
        this.saveAppState();
      }
    },

    start() {
      this.$emit("update:modelValue", false);
    },
  },
});
</script>
