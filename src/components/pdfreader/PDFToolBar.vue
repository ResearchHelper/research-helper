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
          "(" +
          pdfApp.state.currentPageNumber +
          " of " +
          pdfApp.state.pagesCount +
          ")"
        }}
      </span>
      <span v-else>
        {{ " of " + pdfApp.state.pagesCount }}
      </span>
    </div>

    <q-space />

    <!-- tools -->
    <q-btn-toggle
      :model-value="pdfApp.state.tool"
      @update:model-value="(tool: AnnotationType) => pdfApp.changeTool(tool)"
      :ripple="false"
      flat
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
          icon: 'bi-eraser-fill',
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
        <InkDropDownBtn
          :inkThickness="pdfApp.state.inkThickness"
          :inkOpacity="pdfApp.state.inkOpacity"
          @changeThickness="(thickness: number) => pdfApp.changeInkThickness(thickness)"
          @changeOpacity="(opacity: number) => pdfApp.changeInkOpacity(opacity)"
          @setInkTool="pdfApp.changeTool(AnnotationType.INK)"
        />
      </template>
      <template v-slot:eraser>
        <q-tooltip>Eraser</q-tooltip>
      </template>
    </q-btn-toggle>
    <q-btn
      :style="`background: ${pdfApp.state.color}`"
      :ripple="false"
      flat
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
    <q-btn-dropdown
      dense
      flat
      :ripple="false"
      icon="visibility"
      size="0.7rem"
      padding="xs"
      data-cy="btn-dropdown-view"
    >
      <template v-slot:label>
        <q-tooltip>{{ $t("view") }}</q-tooltip>
      </template>
      <q-list dense>
        <q-item class="row justify-between items-center">
          <q-btn
            dense
            flat
            :ripple="false"
            icon="expand"
            class="rotate-90"
            @click="pdfApp.changeScale({ scaleValue: 'page-width' })"
          >
            <q-tooltip>{{ $t("page-width") }}</q-tooltip>
          </q-btn>
          <q-btn
            dense
            flat
            :ripple="false"
            icon="expand"
            @click="pdfApp.changeScale({ scaleValue: 'page-height' })"
          >
            <q-tooltip>{{ $t("page-height") }}</q-tooltip>
          </q-btn>
        </q-item>
        <q-separator />
        <q-item class="row justify-center items-center">
          <q-btn
            dense
            flat
            :ripple="false"
            icon="zoom_out"
            @click="pdfApp.changeScale({ delta: -0.1 })"
          >
            <q-tooltip>{{ $t("zoom-out") }}</q-tooltip>
          </q-btn>
          <div data-cy="scale">
            {{ Math.trunc(pdfApp.state.currentScale * 100) + "%" }}
          </div>
          <q-btn
            dense
            flat
            :ripple="false"
            icon="zoom_in"
            @click="pdfApp.changeScale({ delta: 0.1 })"
          >
            <q-tooltip>{{ $t("zoom-in") }}</q-tooltip>
          </q-btn>
        </q-item>
        <q-separator />
        <q-item class="justify-center">
          <q-btn-toggle
            class="column"
            flat
            stack
            dense
            square
            no-caps
            :ripple="false"
            toggle-color="primary"
            :options="[
              { label: $t('no-spreads'), value: 0 },
              { label: $t('odd-spreads'), value: 1 },
              { label: $t('even-spreads'), value: 2 },
            ]"
            :model-value="pdfApp.state.spreadMode"
            @update:model-value="(mode: number) => pdfApp.changeSpreadMode(mode)"
            data-cy="btn-toggle-spread"
          />
        </q-item>
      </q-list>
    </q-btn-dropdown>

    <q-btn
      v-if="!fullscreen"
      dense
      square
      flat
      :ripple="false"
      icon="fullscreen"
      size="0.9rem"
      padding="none"
      @click="requestFullscreen"
    >
      <q-tooltip>{{ $t("enter-full-screen") }}</q-tooltip>
    </q-btn>
    <q-btn
      v-else
      dense
      square
      flat
      size="0.9rem"
      padding="none"
      :ripple="false"
      icon="fullscreen_exit"
      @click="exitFullscreen"
    >
      <q-tooltip>{{ $t("exit-full-screen") }}</q-tooltip>
    </q-btn>

    <q-btn
      square
      flat
      :ripple="false"
      icon="search"
      size="0.8rem"
      padding="none"
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

    <q-space />

    <!-- right menu -->
    <q-btn-toggle
      :model-value="showRightMenu"
      @update:model-value="(visible: boolean) => $emit('update:showRightMenu', visible)"
      clearable
      unelevated
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
  PropType,
  reactive,
  ref,
  watch,
} from "vue";
import { AnnotationType, PDFSearch, PDFState } from "src/backend/database";

import ColorPicker from "./ColorPicker.vue";
import InkDropDownBtn from "./InkDropDownBtn.vue";
import { useI18n } from "vue-i18n";
import { QMenu, useQuasar } from "quasar";
import { PDFApplication } from "src/backend/pdfreader";

const $q = useQuasar();
const { t } = useI18n({ useScope: "global" });

/**
 * Props, emits, data
 */
const props = defineProps({
  showRightMenu: { type: Boolean, required: true },
});

const pdfApp = inject("pdfApp") as PDFApplication;

const emit = defineEmits(["update:showRightMenu"]);

const searchMenu = ref<QMenu>();
const search = reactive({
  query: "",
  highlightAll: true,
  caseSensitive: false,
  entireWord: false,
});
const fullscreen = ref(false);

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

async function requestFullscreen() {
  await $q.fullscreen.request();
  // after successfully fullscreened, remove leftmenu
  fullscreen.value = true;
}

async function exitFullscreen() {
  await $q.fullscreen.exit();
  // after exit fullscreen, show leftmenu again
  fullscreen.value = false;
}

function changeThickness(thickness: number) {
  emit("changeInkThickness", thickness);
}

function changeOpacity(opacity: number) {
  emit("changeInkOpacity", opacity);
}

onMounted(() => {
  // hot keys
  document.addEventListener("keypress", toggleSearchMenu);
});

onBeforeUnmount(() => {
  document.removeEventListener("keypress", toggleSearchMenu);
});
</script>
