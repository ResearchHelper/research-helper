<template>
  <q-toolbar
    style="
      min-height: unset;
      height: 36px;
      background: var(--color-pdfreader-toolbar-bkgd);
    "
  >
    <!-- navigation -->
    <div data-cy="page-control">
      <input
        style="height: 1.5rem; width: 3rem"
        :value="pageLabel"
        @keydown.enter="(e: KeyboardEvent) => changePage((e.target as HTMLInputElement).value)"
      />
      <span v-if="pdfApp.pageLabels?.length > 0">
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
      :darkMode="pdfApp.state.darkMode"
      @changeScale="(params) => pdfApp.changeScale(params)"
      @changeSpreadMode="(mode) => pdfApp.changeSpreadMode(mode)"
      @toggleFullscreen="toggleFullscreen"
      @toggleDarkMode="toggleDarkMode"
    />

    <q-space />

    <!-- tools -->
    <q-btn-toggle
      v-model="pdfApp.state.tool"
      :ripple="false"
      unelevated
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
          value: AnnotationType.ERASER,
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
          v-model:eraserType="(pdfApp.state.eraserType as EraserType)"
          v-model:eraserThickness="pdfApp.state.eraserThickness"
          @setEraserTool="pdfApp.changeTool(AnnotationType.ERASER)"
        />
      </template>
    </q-btn-toggle>

    <!-- color btn -->
    <q-btn
      class="q-ml-xs"
      :style="`background: ${pdfApp.state.color}`"
      :ripple="false"
      flat
      size="0.5rem"
    >
      <q-tooltip>{{ $t("color") }}</q-tooltip>
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

    <SearchDropdownBtn
      :matchesCount="pdfApp.matchesCount"
      @search="(params) => pdfApp.searchText(params)"
      @clear="pdfApp.searchText({ query: '' } as PDFSearch)"
      @changeMatch="(delta) => pdfApp.changeMatch(delta)"
    />
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
import { useQuasar } from "quasar";
import { computed, inject, ref } from "vue";
import { AnnotationType, EraserType, PDFSearch } from "src/backend/database";
import { KEY_pdfApp } from "./injectKeys";
import PDFApplication from "src/backend/pdfreader";

import ColorPicker from "./ColorPicker.vue";
import InkDropdownBtn from "./InkDropdownBtn.vue";
import EraserDropdownBtn from "./EraserDropdownBtn.vue";
import ViewDropdownBtn from "./ViewDropdownBtn.vue";
import SearchDropdownBtn from "./SearchDropdownBtn.vue";

const $q = useQuasar();

/**
 * Props, emits, data
 */
const props = defineProps({
  showRightMenu: { type: Boolean, required: true },
});
const emit = defineEmits(["update:showRightMenu"]);

const pdfApp = inject(KEY_pdfApp) as PDFApplication;

const isFullscreen = ref(false);

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

async function toggleFullscreen() {
  if (isFullscreen.value) await $q.fullscreen.exit();
  else await $q.fullscreen.request();

  isFullscreen.value = !isFullscreen.value;
}

async function toggleDarkMode() {
  pdfApp.changeViewMode(!pdfApp.state.darkMode);
}

defineExpose({ changePage, toggleDarkMode });
</script>
