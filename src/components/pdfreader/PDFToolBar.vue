<template>
  <q-toolbar style="min-height: unset; height: 36px">
    <!-- navigation -->
    <div>
      <input
        style="width: 3em"
        :value="pdfState.currentPageNumber"
        @keydown.enter="(e) => $emit('changePageNumber', e.target.value)"
      />
      {{ "of " + pdfState.pagesCount }}
    </div>

    <q-space />

    <!-- tools -->
    <q-btn-toggle
      v-model="pdfState.tool"
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
        <q-color
          v-model="pdfState.color"
          no-header
          no-footer
          bordered
          default-view="palette"
          :palette="[
            '#FFFF00',
            '#019A9D',
            '#D9B801',
            '#E8045A',
            '#B2028A',
            '#2A0449',
          ]"
        />
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
        <q-item class="items-center">
          <q-btn
            dense
            :ripple="false"
            @click="$emit('changeScale', { scaleValue: 'page-width' })"
          >
            Page Width
          </q-btn>
          <q-btn
            dense
            :ripple="false"
            @click="$emit('changeScale', { scaleValue: 'page-height' })"
          >
            Page Height
          </q-btn>
          <q-btn
            :ripple="false"
            @click="$emit('changeScale', { delta: -0.1 })"
          >
            -
          </q-btn>
          <div>
            {{ Math.trunc(pdfState.currentScale * 100) + "%" }}
          </div>
          <q-btn
            :ripple="false"
            @click="$emit('changeScale', { delta: 0.1 })"
          >
            +
          </q-btn>
        </q-item>
        <q-separator />
        <q-item>
          <q-btn-toggle
            stack
            dense
            :ripple="false"
            toggle-color="primary"
            :options="[
              { label: 'No Spread', value: 0 },
              { label: 'Odd Spread', value: 1 },
              { label: 'Even Spread', value: 2 },
            ]"
            v-model="pdfState.spreadMode"
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
        @hide="clearSearch"
      >
        <q-item dense>
          <q-input
            dense
            outlined
            hide-bottom-space
            placeholder="Search"
            v-model="pdfState.search.query"
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
            v-model="pdfState.search.highlightAll"
          />
          <q-checkbox
            dense
            label="Match Case"
            v-model="pdfState.search.caseSensitive"
          />
          <q-checkbox
            dense
            label="Whole Words"
            v-model="pdfState.search.entireWord"
          />
        </q-item>
        <q-item>
          {{ searchSummary }}
        </q-item>
      </q-menu>
    </q-btn>

    <q-space />

    <!-- comment and note -->
    <q-btn-toggle
      v-model="rightMenuMode"
      clearable
      :ripple="false"
      size="sm"
      padding="xs"
      toggle-color="primary"
      :options="[
        { value: 'infoPane', icon: 'list' },
        { value: 'noteEditor', icon: 'sticky_note_2' },
      ]"
    />
  </q-toolbar>
</template>

<script>
import { usePDFStateStore } from "src/stores/pdfState";
import { useStateStore } from "src/stores/appState";
import { AnnotationType } from "src/api/pdfreader/annotation";

export default {
  setup() {
    const pdfState = usePDFStateStore();
    const stateStore = useStateStore();
    return { pdfState, stateStore, AnnotationType };
  },

  computed: {
    rightMenuMode: {
      get() {
        return this.stateStore.rightMenuMode;
      },

      set(mode) {
        if (!!mode) {
          this.stateStore.openRightMenu(mode);
        } else {
          this.stateStore.closeRightMenu();
        }
      },
    },

    searchSummary() {
      let text = "";
      let matchesCount = this.pdfState.matchesCount;
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

  methods: {
    clearSearch() {
      this.readyForSearch = false;
      this.$emit("searchText", { query: "" });
    },
  },
};
</script>
