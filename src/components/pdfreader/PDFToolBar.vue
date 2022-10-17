<template>
  <div class="toolBar row justify-between items-center content-center">
    <!-- navigation -->
    <div>
      <input
        style="width: 3em"
        :value="pdfState.currentPageNumber"
        @keydown.enter="(e) => $emit('changePageNumber', e.target.value)"
      />
      {{ "of " + pdfState.pagesCount }}
    </div>

    <!-- tools -->
    <div>
      <q-btn-toggle
        v-model="tool"
        unelevated
        :ripple="false"
        size="sm"
        padding="xs"
        toggle-color="primary"
        :options="[
          { value: AnnotationType.NONE, icon: 'navigation' },
          { value: AnnotationType.HIGHLIGHT, icon: 'border_color' },
          { value: AnnotationType.COMMENT, icon: 'comment' },
        ]"
        @update:model-value="$emit('changeTool', tool)"
      />
      <q-btn
        :style="`background: ${color}`"
        unelevated
        :ripple="false"
        size="xs"
      >
        <q-menu>
          <q-color
            v-model="color"
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
            @change="$emit('changeColor', color)"
          />
        </q-menu>
      </q-btn>
      <q-btn-dropdown
        dense
        unelevated
        :ripple="false"
        icon="visibility"
        size="sm"
        padding="xs"
      >
        <q-list dense>
          <q-btn-toggle
            stack
            dense
            :ripple="false"
            v-model="scaleValue"
            toggle-color="primary"
            :options="[
              { label: 'Page Width', value: 'page-width' },
              { label: 'Page Height', value: 'page-height' },
            ]"
            @update:model-value="$emit('changeScaleValue', scaleValue)"
          />

          <q-btn
            :ripple="false"
            @click="
              scaleValue = null;
              $emit('changeScale', -0.1);
            "
          >
            -
          </q-btn>
          {{ Math.trunc(pdfState.currentScale * 100) + "%" }}
          <q-btn
            :ripple="false"
            @click="
              scaleValue = null;
              $emit('changeScale', 0.1);
            "
          >
            +
          </q-btn>
          <q-separator />
          <q-item>
            <q-btn-toggle
              stack
              dense
              :ripple="false"
              v-model="spreadMode"
              toggle-color="primary"
              :options="[
                { label: 'No Spread', value: 0 },
                { label: 'Odd Spread', value: 1 },
                { label: 'Even Spread', value: 2 },
              ]"
              @update:model-value="$emit('changeSpreadMode', spreadMode)"
            />
          </q-item>
        </q-list>
      </q-btn-dropdown>

      <q-btn
        square
        unelevated
        :ripple="false"
        icon="search"
        size="sm"
        padding="xs"
      >
        <q-menu>
          <q-item dense>
            <q-input
              dense
              placeholder="Search"
              v-model="searchText"
              @keydown.enter="(e) => $emit('searchText', e.target.value)"
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
            {{ pdfState.matchesCount }}
          </q-item>
        </q-menu>
      </q-btn>
    </div>

    <!-- comment and note -->
    <div>
      <q-btn
        square
        unelevated
        :ripple="false"
        icon="sticky_note_2"
        size="sm"
        padding="xs"
      />
      <q-btn
        square
        unelevated
        :ripple="false"
        icon="edit_note"
        size="sm"
        padding="xs"
      />
    </div>
  </div>
</template>

<script>
import { useStateStore } from "src/stores/appState";
import { AnnotationType } from "src/annotation";

export default {
  // props: ["pdfState"],

  setup() {
    const stateStore = useStateStore();
    // return AnnotationType so that template can use it
    return { stateStore, AnnotationType };
  },

  computed: {
    pdfState() {
      return this.stateStore.getPDFState();
    },
  },

  data() {
    return {
      tool: AnnotationType.NONE,
      spreadMode: 0,
      scaleValue: "page-width",

      searchText: "",

      color: "#FFFF00",
    };
  },
};
</script>

<style scoped>
.toolBar {
  width: 100%;
  height: 3%;
  background-color: rgb(132, 133, 136);
}
.colorPicker {
  width: 100px;
}
</style>
