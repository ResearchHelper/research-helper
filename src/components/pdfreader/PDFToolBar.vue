<template>
  <q-toolbar style="min-height: unset; height: 36px; background: #222222">
    <!-- navigation -->
    <div data-cy="page-control">
      <input
        style="height: 1.5rem; width: 3rem"
        :value="pageLabel"
        @keydown.enter="(e: KeyboardEvent) => changePage((e.target as HTMLInputElement).value)"
      />
      <span v-if="!!pdfApp.pageLabels">
        {{
          " (" +
          pdfApp.state.currentPageNumber +
          " of " +
          pdfApp.state.pagesCount +
          ") "
        }}
      </span>
      <span v-else>
        {{ " of " + pdfApp.state.pagesCount }}
      </span>
    </div>
    <ViewDropdownBtn
      :currentScale="pdfApp.state.currentScale"
      :spreadMode="pdfApp.state.spreadMode"
      :isFullscreen="isFullscreen"
      @changeScale="(params) => pdfApp.changeScale(params)"
      @changeSpreadMode="(mode) => pdfApp.changeSpreadMode(mode)"
      @toggleFullscreen="toggleFullscreen"
    />

    <q-space />

    <!-- tools -->
    <q-btn-toggle
      v-model="pdfApp.state.tool"
      :ripple="false"
      fab
      push
      size="0.7rem"
      padding="xs"
      toggle-color="primary"
      :options="[
        {
          value: AnnotationType.CURSOR,
          icon: 'bi-cursor-text',
          slot: AnnotationType.CURSOR,
        },
        {
          value: AnnotationType.HIGHLIGHT,
          icon: 'border_color',
          slot: AnnotationType.HIGHLIGHT,
        },
        {
          value: AnnotationType.UNDERLINE,
          icon: 'format_underlined',
          slot: AnnotationType.UNDERLINE,
        },
        {
          value: AnnotationType.STRIKEOUT,
          icon: 'format_strikethrough',
          slot: AnnotationType.STRIKEOUT,
        },
        {
          value: AnnotationType.RECTANGLE,
          icon: 'rectangle',
          slot: AnnotationType.RECTANGLE,
        },
        {
          value: AnnotationType.COMMENT,
          icon: 'comment',
          slot: AnnotationType.COMMENT,
        },
        {
          value: AnnotationType.INK,
          slot: AnnotationType.INK,
        },
        {
          value: 'eraser',
          slot: 'eraser',
        },
      ]"
    >
      <template v-slot:cursor>
        <q-tooltip>{{ $t("cursor") }}</q-tooltip>
      </template>
      <template v-slot:highlight>
        <q-tooltip>{{ $t("highlight") }}</q-tooltip>
      </template>
      <template v-slot:underline>
        <q-tooltip>{{ $t("underline") }}</q-tooltip>
      </template>
      <template v-slot:strikeout>
        <q-tooltip>{{ $t("strikeout") }}</q-tooltip>
      </template>
      <template v-slot:rectangle>
        <q-tooltip>{{ $t("rectangle") }}</q-tooltip>
      </template>
      <template v-slot:comment>
        <q-tooltip>{{ $t("comment") }}</q-tooltip>
      </template>
      <template v-slot:ink>
        <InkDropdownBtn
          v-model:inkThickness="pdfApp.state.inkThickness"
          v-model:inkOpacity="pdfApp.state.inkOpacity"
          @setInkTool="pdfApp.changeTool(AnnotationType.INK)"
        />
      </template>
      <template v-slot:eraser>
        <EraserDropdownBtn
          v-model:eraserThickness="pdfApp.state.eraserThickness"
          @setEraserTool="pdfApp.changeTool(AnnotationType.ERASER)"
        />
      </template>
    </q-btn-toggle>
    <q-btn
      :style="`background: ${pdfApp.state.color}`"
      :ripple="false"
      push
      size="0.5rem"
    >
      <q-tooltip>{{ $t("highlight-color") }}</q-tooltip>
      <q-menu
        anchor="bottom middle"
        self="top middle"
      >
        <q-item
          dense
          style="width: 10rem"
        >
          <ColorPicker
            @selected="(color: string) => pdfApp.changeColor(color)"
          />
        </q-item>
      </q-menu>
    </q-btn>

    <q-space />

    <!-- right menu -->
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
        @show="pdfApp.searchText(search)"
        @hide="clearSearch"
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
            @keydown.enter="pdfApp.changeMatch(1)"
          ></q-input>
          <q-btn
            dense
            flat
            icon="arrow_back"
            :ripple="false"
            @click="pdfApp.changeMatch(-1)"
          />
          <q-btn
            dense
            flat
            icon="arrow_forward"
            :ripple="false"
            @click="pdfApp.changeMatch(1)"
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

    <q-btn-toggle
      :model-value="showRightMenu"
      @update:model-value="(visible: boolean) => $emit('update:showRightMenu', visible)"
      clearable
      push
      :ripple="false"
      size="0.7rem"
      padding="xs"
      toggle-color="primary"
      :options="[{ value: true, icon: 'list' }]"
    >
      <template v-slot:default>
        <q-tooltip>{{ $t("toggle-right-menu") }}</q-tooltip>
      </template>
    </q-btn-toggle>
  </q-toolbar>
</template>

<script setup lang="ts">
import {
  computed,
  inject,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import { AnnotationType, PDFSearch } from "src/backend/database";

import ColorPicker from "./ColorPicker.vue";
import InkDropdownBtn from "./InkDropdownBtn.vue";
import { useI18n } from "vue-i18n";
import { QMenu, useQuasar } from "quasar";
import PDFApplication from "src/backend/pdfreader";
import EraserDropdownBtn from "./EraserDropdownBtn.vue";
import ViewDropdownBtn from "./ViewDropdownBtn.vue";

const $q = useQuasar();
const { t } = useI18n({ useScope: "global" });

/**
 * Props, emits, data
 */
const props = defineProps({
  showRightMenu: { type: Boolean, required: true },
});
const emit = defineEmits(["update:showRightMenu"]);

const pdfApp = inject("pdfApp") as PDFApplication;
const searchMenu = ref<QMenu>();
const search = reactive({
  query: "",
  highlightAll: true,
  caseSensitive: false,
  entireWord: false,
});
const isFullscreen = ref(false);

watch(search, (newSearch) => {
  pdfApp.searchText(newSearch);
});

const searchSummary = computed(() => {
  let text = "";
  let matchesCount = pdfApp.matchesCount;
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

const pageLabel = computed(() => {
  let pageNumber = pdfApp.state.currentPageNumber;
  if (pdfApp.pageLabels?.length > 0) {
    return pdfApp.pageLabels[pageNumber - 1];
  } else {
    return pageNumber;
  }
});

function changePage(pageLabel: string) {
  let pageNumber = 1;
  if (pdfApp.pageLabels.length > 0) {
    // If pageLabels exists
    let pageIndex = pdfApp.pageLabels.indexOf(pageLabel);
    if (pageIndex === -1) return; // do nothing if not finding the label
    pageNumber = pageIndex + 1;
  } else {
    // If there are no pageLabels
    pageNumber = parseInt(pageLabel);
  }
  pdfApp.changePageNumber(pageNumber);
}

function toggleSearchMenu(e: KeyboardEvent) {
  if (e.ctrlKey && e.key.toLowerCase() === "f" && searchMenu.value)
    searchMenu.value.toggle();
}

function clearSearch() {
  pdfApp.searchText({ query: "" } as PDFSearch);
}

async function toggleFullscreen() {
  if (isFullscreen.value) await $q.fullscreen.exit();
  else await $q.fullscreen.request();

  isFullscreen.value = !isFullscreen.value;
}

onMounted(() => {
  // hot keys
  document.addEventListener("keypress", toggleSearchMenu);
});

onBeforeUnmount(() => {
  document.removeEventListener("keypress", toggleSearchMenu);
});
</script>
