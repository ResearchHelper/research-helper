<template>
  <q-btn-dropdown
    dense
    split
    size="0.8rem"
    :ripple="false"
    icon="draw"
    padding="none"
    @click="$emit('setInkTool')"
    data-cy="btn-dropdown"
  >
    <template v-slot:label>
      <q-tooltip>{{ $t("ink") }}</q-tooltip>
    </template>
    <q-list dense>
      <q-item style="width: 300px">
        <div class="full-width q-pt-sm">
          <div>
            {{ $t("thickness") + ":" }}
            <input
              v-model="thickness"
              style="width: 3em"
              type="number"
              data-cy="input-thickness"
            />px
          </div>
          <q-slider
            v-model="thickness"
            :min="1"
            :max="30"
            :step="1"
            color="primary"
            data-cy="slider-thickness"
          />
        </div>
      </q-item>
      <q-item style="width: 300px">
        <div class="full-width">
          <div>
            {{ $t("opacity") + ":" }}
            <input
              v-model="opacity"
              style="width: 3em"
              type="number"
              data-cy="input-opacity"
            />%
          </div>
          <q-slider
            v-model="opacity"
            :min="10"
            :max="100"
            :step="1"
            color="primary"
            data-cy="slider-opacity"
          />
        </div>
      </q-item>
    </q-list>
  </q-btn-dropdown>
</template>
<script setup lang="ts">
import { computed } from "vue";

const props = defineProps({
  inkThickness: { type: Number, required: true },
  inkOpacity: { type: Number, required: true },
});
const emit = defineEmits([
  "setInkTool",
  "update:inkThickness",
  "update:inkOpacity",
]);

const thickness = computed({
  get() {
    return props.inkThickness;
  },
  set(value: number) {
    if (value > 30) value = 30;
    else if (value < 1) value = 1;
    emit("update:inkThickness", value);
  },
});

const opacity = computed({
  get() {
    // display percentage
    return Math.round(props.inkOpacity * 100);
  },
  set(value: number) {
    value /= 100;
    if (value > 1.0) value = 1;
    else if (value < 0.1) value = 0.1;
    emit("update:inkOpacity", value);
  },
});
</script>
