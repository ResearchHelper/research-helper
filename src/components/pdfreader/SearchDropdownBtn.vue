<template>
  <q-btn
    push
    :ripple="false"
    icon="search"
    size="0.8rem"
    padding="xs"
    ref="searchBtn"
  >
    <q-tooltip>{{ $t("search") }}</q-tooltip>
    <q-menu
      persistent
      @show="$emit('search', search)"
      @hide="$emit('clear')"
      ref="searchMenu"
    >
      <q-item
        dense
        class="row"
      >
        <q-input
          class="col q-mt-sm"
          dense
          outlined
          hide-bottom-space
          :placeholder="$t('search')"
          v-model="search.query"
          @keydown.enter="$emit('changeMatch', 1)"
        ></q-input>
        <q-btn
          dense
          flat
          icon="arrow_back"
          :ripple="false"
          @click="$emit('changeMatch', -1)"
        />
        <q-btn
          dense
          flat
          icon="arrow_forward"
          :ripple="false"
          @click="$emit('changeMatch', 1)"
        />
      </q-item>
      <q-item>
        <q-checkbox
          dense
          :label="$t('highlight-all')"
          v-model="search.highlightAll"
        />
        <q-checkbox
          dense
          :label="$t('match-case')"
          class="q-ml-sm"
          v-model="search.caseSensitive"
        />
        <q-checkbox
          dense
          :label="$t('whole-words')"
          class="q-ml-sm"
          v-model="search.entireWord"
        />
      </q-item>
      <q-item class="q-py-none">
        {{ searchSummary }}
      </q-item>
    </q-menu>
  </q-btn>
</template>
<script setup lang="ts">
import { QMenu } from "quasar";
import {
  computed,
  reactive,
  PropType,
  ref,
  onMounted,
  watch,
  onBeforeUnmount,
} from "vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n({ useScope: "global" });

const searchMenu = ref<QMenu>();
const props = defineProps({
  matchesCount: {
    type: Object as PropType<{ current: number; total: number }>,
    required: false,
  },
});

const emit = defineEmits(["search", "clear", "changeMatch"]);

const search = reactive({
  query: "",
  highlightAll: true,
  caseSensitive: false,
  entireWord: false,
});
watch(search, (newSearch) => {
  emit("search", newSearch);
});

const searchSummary = computed(() => {
  let text = "";
  let matchesCount = props.matchesCount;
  if (!!matchesCount) {
    if (matchesCount.total != 0) {
      text = t("matchescount-current-of-matchescount-total-matches", [
        matchesCount.current,
        matchesCount.total,
      ]);
    } else {
      text = t("phrase-not-found");
    }
  }

  return text;
});

function toggleSearchMenu(e: KeyboardEvent) {
  if (e.ctrlKey && e.key.toLowerCase() === "f" && searchMenu.value)
    searchMenu.value.toggle();
}

onMounted(() => {
  // hot keys
  document.addEventListener("keypress", toggleSearchMenu);
});

onBeforeUnmount(() => {
  document.removeEventListener("keypress", toggleSearchMenu);
});
</script>
