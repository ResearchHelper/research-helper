<template>
  <q-toolbar style="min-height: unset; height: 36px; background: #222222">
    <!-- navigation -->
    <div>
      <input
        style="height: 1.5rem; width: 3rem"
        :value="pageLabel"
        @keydown.enter="(e: KeyboardEvent) => changePage((e.target as HTMLInputElement).value)"
      />
      <span v-if="!!pageLabels">
        {{
          "(" + pdfState.currentPageNumber + " of " + pdfState.pagesCount + ")"
        }}
      </span>
      <span v-else>
        {{ " of " + pdfState.pagesCount }}
      </span>
    </div>

    <q-space />

    <!-- tools -->
    <q-btn-toggle
      v-model="state.tool"
      @update:model-value="$emit('update:pdfState', state)"
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
          value: AnnotationType.RECTANGLE,
          icon: 'rectangle',
          slot: AnnotationType.RECTANGLE,
        },
        {
          value: AnnotationType.COMMENT,
          icon: 'comment',
          slot: AnnotationType.COMMENT,
        },
      ]"
    >
      <template v-slot:cursor>
        <q-tooltip>{{ $t("cursor") }}</q-tooltip>
      </template>
      <template v-slot:highlight>
        <q-tooltip>{{ $t("highlight") }}</q-tooltip>
      </template>
      <template v-slot:rectangle>
        <q-tooltip>{{ $t("rectangle") }}</q-tooltip>
      </template>
      <template v-slot:comment>
        <q-tooltip>{{ $t("comment") }}</q-tooltip>
      </template>
    </q-btn-toggle>
    <q-btn
      :style="`background: ${pdfState.color}`"
      flat
      :ripple="false"
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
            @selected="
              (color: string) => {
                state.color = color;
                $emit('update:pdfState', state);
              }
            "
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
    >
      <template v-slot:label
        ><q-tooltip>{{ $t("view") }}</q-tooltip></template
      >
      <q-list dense>
        <q-item class="row justify-between items-center">
          <q-btn
            dense
            flat
            :ripple="false"
            icon="expand"
            class="rotate-90"
            @click="$emit('changeScale', { scaleValue: 'page-width' })"
          >
            <q-tooltip>{{ $t("page-width") }}</q-tooltip>
          </q-btn>
          <q-btn
            dense
            flat
            :ripple="false"
            icon="expand"
            @click="$emit('changeScale', { scaleValue: 'page-height' })"
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
            @click="$emit('changeScale', { delta: -0.1 })"
          >
            <q-tooltip>{{ $t("zoom-out") }}</q-tooltip>
          </q-btn>
          <div>
            {{ Math.trunc(pdfState.currentScale * 100) + "%" }}
          </div>
          <q-btn
            dense
            :ripple="false"
            icon="zoom_in"
            @click="$emit('changeScale', { delta: 0.1 })"
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
            v-model="state.spreadMode"
            @update:model-value="
              () => {
                $emit('update:pdfState', state);
                $emit('changeSpreadMode', state.spreadMode);
              }
            "
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
      padding="xs"
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
        @show="$emit('searchText', search)"
        @hide="clearSearch"
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

    <q-space />

    <!-- right menu -->
    <q-btn-toggle
      v-model="showRightMenu"
      clearable
      unelevated
      :ripple="false"
      size="0.7rem"
      padding="xs"
      toggle-color="primary"
      :options="[{ value: true, icon: 'list' }]"
      @update:model-value="$emit('toggleRightMenu', showRightMenu)"
    >
      <template v-slot:default>
        <q-tooltip>{{ $t("toggle-right-menu") }}</q-tooltip>
      </template>
    </q-btn-toggle>
  </q-toolbar>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { AnnotationType, PDFState } from "src/backend/database";

import { useStateStore } from "src/stores/appState";
import ColorPicker from "./ColorPicker.vue";

export default defineComponent({
  props: {
    pdfState: { type: Object as PropType<PDFState>, required: true },
    pageLabels: { required: true, type: Object as PropType<string[]> },
    matchesCount: Object,
    rightMenuSize: Number,
  },
  emits: [
    "update:pdfState",
    "changePageNumber",
    "changeScale",
    "changeSpreadMode",
    "searchText",
    "changeMatch",
    "toggleRightMenu",
  ],

  components: {
    ColorPicker,
  },

  setup() {
    const stateStore = useStateStore();
    return { stateStore, AnnotationType };
  },

  data() {
    return {
      search: {
        query: "",
        highlightAll: true,
        caseSensitive: false,
        entireWord: false,
      },
      state: {} as PDFState,
      showRightMenu: false,

      fullscreen: false,
    };
  },

  watch: {
    rightMenuSize(size) {
      this.showRightMenu = size > 0;
    },

    pdfState: {
      handler(state) {
        this.state = state;
      },
      deep: true,
    },

    search: {
      handler(newSearch) {
        this.$emit("searchText", newSearch);
      },
      deep: true,
    },
  },

  computed: {
    searchSummary() {
      let text = "";
      let matchesCount = this.matchesCount;
      if (!!matchesCount) {
        if (matchesCount.total != 0) {
          text = this.$t("matchescount-current-of-matchescount-total-matches", [
            matchesCount.current,
            matchesCount.total,
          ]);
        } else {
          text = this.$t("phrase-not-found");
        }
      }

      return text;
    },

    pageLabel() {
      let pageNumber = this.pdfState.currentPageNumber;
      if (this.pageLabels?.length > 0) {
        return this.pageLabels[pageNumber - 1];
      } else {
        return pageNumber;
      }
    },
  },

  mounted() {
    this.state = this.pdfState;
  },

  methods: {
    changePage(pageLabel: string) {
      let pageNumber = 1;
      if (this.pageLabels.length > 0) {
        // If pageLabels exists
        let pageIndex = this.pageLabels.indexOf(pageLabel);
        if (pageIndex === -1) return; // do nothing if not finding the label
        pageNumber = pageIndex + 1;
      } else {
        // If there are no pageLabels
        pageNumber = parseInt(pageLabel);
      }
      this.state.currentPageNumber = pageNumber;
      this.$emit("update:pdfState", this.state);
      this.$emit("changePageNumber", this.state.currentPageNumber);
    },

    clearSearch() {
      this.$emit("searchText", { query: "" });
    },

    async requestFullscreen() {
      await this.$q.fullscreen.request();
      // after successfully fullscreened, remove leftmenu
      this.fullscreen = true;
    },

    async exitFullscreen() {
      await this.$q.fullscreen.exit();
      // after exit fullscreen, show leftmenu again
      this.fullscreen = false;
    },
  },
});
</script>
