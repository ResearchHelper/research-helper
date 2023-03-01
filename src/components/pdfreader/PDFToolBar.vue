<template>
  <q-toolbar style="min-height: unset; height: 36px; background: #222222">
    <!-- navigation -->
    <div>
      <input
        style="height: 1.5rem; width: 3rem"
        :value="pdfState.currentPageNumber"
        @keydown.enter="
          (e) => {
            state.currentPageNumber = e.target.value;
            $emit('update:pdfState', state);
            $emit('changePageNumber', e.target.value);
          }
        "
      />
      {{ "of " + pdfState.pagesCount }}
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
          value: AnnotationType.NONE,
          icon: 'navigation',
          slot: AnnotationType.NONE,
        },
        {
          value: AnnotationType.HIGHLIGHT,
          icon: 'border_color',
          slot: AnnotationType.HIGHLIGHT,
        },
        {
          value: AnnotationType.COMMENT,
          icon: 'comment',
          slot: AnnotationType.COMMENT,
        },
      ]"
    >
      <template v-slot:cursor>
        <q-tooltip>Cursor</q-tooltip>
      </template>
      <template v-slot:highlight>
        <q-tooltip>Highlight</q-tooltip>
      </template>
      <template v-slot:comment>
        <q-tooltip>Comment</q-tooltip>
      </template>
    </q-btn-toggle>
    <q-btn
      :style="`background: ${pdfState.color}`"
      flat
      :ripple="false"
      size="0.5rem"
    >
      <q-tooltip>Highlight color</q-tooltip>
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
              (color) => {
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
      <template v-slot:label><q-tooltip>View</q-tooltip></template>
      <q-list dense>
        <q-item class="row justify-center items-center">
          <q-btn
            dense
            flat
            :ripple="false"
            icon="expand"
            class="rotate-90"
            @click="$emit('changeScale', { scaleValue: 'page-width' })"
          />
          <q-btn
            dense
            flat
            :ripple="false"
            icon="expand"
            @click="$emit('changeScale', { scaleValue: 'page-height' })"
          />
        </q-item>
        <q-separator />
        <q-item class="row justify-center items-center">
          <q-btn
            dense
            flat
            :ripple="false"
            icon="remove"
            @click="$emit('changeScale', { delta: -0.1 })"
          />
          <div>
            {{ Math.trunc(pdfState.currentScale * 100) + "%" }}
          </div>
          <q-btn
            dense
            :ripple="false"
            icon="add"
            @click="$emit('changeScale', { delta: 0.1 })"
          />
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
              { label: 'No Spreads', value: 0 },
              { label: 'Odd Spreads', value: 1 },
              { label: 'Even Spreads', value: 2 },
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
      <q-tooltip>Enter full screen</q-tooltip>
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
      <q-tooltip>Exit full screen</q-tooltip>
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
      <q-tooltip>Search</q-tooltip>
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
            placeholder="Search"
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
            label="Highlight All"
            v-model="search.highlightAll"
          />
          <q-checkbox
            dense
            label="Match Case"
            class="q-ml-sm"
            v-model="search.caseSensitive"
          />
          <q-checkbox
            dense
            label="Whole Words"
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
        <q-tooltip>Toggle right menu</q-tooltip>
      </template>
    </q-btn-toggle>
  </q-toolbar>
</template>

<script>
import { useQuasar } from "quasar";
import { useStateStore } from "src/stores/appState";
import { AnnotationType } from "src/backend/pdfreader/annotation";
import ColorPicker from "./ColorPicker.vue";

export default {
  props: { pdfState: Object, matchesCount: Object, rightMenuSize: Number },
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
    const $q = useQuasar();
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
      state: {},
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
          text = `${matchesCount.current} of ${matchesCount.total} matches`;
        } else {
          text = "phrase not found";
        }
      }

      return text;
    },
  },

  mounted() {
    this.state = this.pdfState;
  },

  methods: {
    clearSearch() {
      this.readyForSearch = false;
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
};
</script>
