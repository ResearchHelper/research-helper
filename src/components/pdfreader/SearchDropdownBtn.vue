<template>
  <q-btn
    unelevated
    :ripple="false"
    icon="search"
    size="0.8rem"
    padding="xs"
    data-cy="btn-dropdown"
  >
    <q-tooltip>{{ $t("search") }}</q-tooltip>
    <q-menu
      persistent
      @show="$emit('search', search)"
      @hide="$emit('clear')"
      ref="searchMenu"
      data-cy="menu-dropdown"
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
          data-cy="input-search"
        ></q-input>
        <q-btn
          dense
          flat
          icon="arrow_back"
          :ripple="false"
          @click="$emit('changeMatch', -1)"
          data-cy="btn-change-match-prev"
        />
        <q-btn
          dense
          flat
          icon="arrow_forward"
          :ripple="false"
          @click="$emit('changeMatch', 1)"
          data-cy="btn-change-match-next"
        />
      </q-item>
      <q-item>
        <q-checkbox
          dense
          :label="$t('highlight-all')"
          v-model="search.highlightAll"
          data-cy="checkbox-highlight-all"
        />
        <q-checkbox
          dense
          :label="$t('match-case')"
          class="q-ml-sm"
          v-model="search.caseSensitive"
          data-cy="checkbox-case-sensitive"
        />
        <q-checkbox
          dense
          :label="$t('whole-words')"
          class="q-ml-sm"
          v-model="search.entireWord"
          data-cy="checkbox-entire-word"
        />
      </q-item>
      <q-item
        class="q-py-none"
        data-cy="search-summary"
      >
        {{ searchSummary }}
      </q-item>
    </q-menu>
  </q-btn>
</template>
<script setup lang="ts">
import { QMenu, debounce } from "quasar";
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
watch(
  search,
  debounce((newSearch) => {
    emit("search", newSearch);
  }, 400)
);

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
