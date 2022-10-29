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
        :model-value="pdfState.tool"
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
        @update:model-value="(tool) => $emit('changeTool', tool)"
      />
      <q-btn
        :style="`background: ${pdfState.color}`"
        unelevated
        :ripple="false"
        size="xs"
      >
        <q-menu>
          <q-color
            :model-value="pdfState.color"
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
            @change="(color) => $emit('changeColor', color)"
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
          <q-item class="items-center">
            <q-btn
              dense
              :ripple="false"
              @click="$emit('changeScaleValue', 'page-width')"
            >
              Page Width
            </q-btn>
            <q-btn
              dense
              :ripple="false"
              @click="$emit('changeScaleValue', 'page-height')"
            >
              Page Height
            </q-btn>
            <q-btn
              :ripple="false"
              @click="$emit('changeScale', -0.1)"
            >
              -
            </q-btn>
            <div>
              {{ Math.trunc(pdfState.currentScale * 100) + "%" }}
            </div>
            <q-btn
              :ripple="false"
              @click="$emit('changeScale', 0.1)"
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
              :model-value="pdfState.spreadMode"
              @update:model-value="
                (spreadMode) => $emit('changeSpreadMode', spreadMode)
              "
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
              :model-value="pdfState.searchText"
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
        @click="stateStore.toggleInfoPane()"
      />
    </div>
  </div>
</template>

<script>
import { useStateStore } from "src/stores/appState";
import { AnnotationType } from "src/annotation";

export default {
  props: ["pdfState"],

  setup() {
    const stateStore = useStateStore();
    // return AnnotationType so that template can use it
    return { stateStore, AnnotationType };
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
