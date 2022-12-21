<template>
  <q-toolbar style="min-height: unset; height: 36px">
    <!-- navigation -->
    <div>
      <input
        style="width: 3em"
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
      size="sm"
      padding="xs"
      toggle-color="primary"
      :options="[
        { value: AnnotationType.NONE, icon: 'navigation' },
        { value: AnnotationType.HIGHLIGHT, icon: 'border_color' },
        { value: AnnotationType.COMMENT, icon: 'comment' },
      ]"
    />
    <q-btn
      :style="`background: ${pdfState.color}`"
      unelevated
      :ripple="false"
      size="xs"
    >
      <q-menu>
        <div class="row justify-between">
          <q-btn
            v-for="color in [
              '#FFFF00',
              '#019A9D',
              '#D9B801',
              '#E8045A',
              '#B2028A',
            ]"
            :key="color"
            :style="`background: ${color}; width:25px; height:25px;`"
            flat
            square
            :ripple="false"
            v-close-popup
            padding="none"
            @click="
              () => {
                state.color = color;
                $emit('update:pdfState', state);
              }
            "
          />
        </div>
      </q-menu>
    </q-btn>
    <q-btn-dropdown
      dense
      :ripple="false"
      icon="visibility"
      size="sm"
      padding="xs"
    >
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
        <q-item>
          <q-btn-toggle
            class="column"
            stack
            dense
            :ripple="false"
            toggle-color="primary"
            :options="[
              { label: 'No Spread', value: 0 },
              { label: 'Odd Spread', value: 1 },
              { label: 'Even Spread', value: 2 },
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
      square
      :ripple="false"
      icon="search"
      size="sm"
      padding="xs"
    >
      <q-menu
        persistent
        @show="$emit('searchText', search)"
        @hide="clearSearch"
      >
        <q-item dense>
          <q-input
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
            :ripple="false"
            @click="$emit('changeMatch', -1)"
            >Prev</q-btn
          >
          <q-btn
            dense
            flat
            :ripple="false"
            @click="$emit('changeMatch', 1)"
            >Next</q-btn
          >
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
            v-model="search.caseSensitive"
          />
          <q-checkbox
            dense
            label="Whole Words"
            v-model="search.entireWord"
          />
        </q-item>
        <q-item>
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
      size="sm"
      padding="xs"
      toggle-color="primary"
      :options="[{ value: true, icon: 'list' }]"
      @update:model-value="$emit('toggleRightMenu', showRightMenu)"
    />
  </q-toolbar>
</template>

<script>
import { useStateStore } from "src/stores/appState";
import { AnnotationType } from "src/backend/pdfreader/annotation";
import { set } from "vue-demi";

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
      state: {},
      showRightMenu: false,
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
    this.state = JSON.parse(JSON.stringify(this.pdfState));
  },

  methods: {
    clearSearch() {
      this.readyForSearch = false;
      this.$emit("searchText", { query: "" });
    },
  },
};
</script>
