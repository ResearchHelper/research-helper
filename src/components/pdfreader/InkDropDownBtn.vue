<template>
  <q-btn-dropdown
    dense
    flat
    :ripple="false"
    icon="draw"
    size="0.7rem"
    padding="none"
  >
    <template v-slot:label>
      <q-tooltip>{{ $t("ink") }}</q-tooltip>
    </template>
    <q-list dense>
      <q-item style="width: 300px">
        <div class="full-width q-pt-sm">
          <div>
            Thickness:
            <input
              v-model="thickness"
              @change="changeOpacity"
              style="width: 3em"
            />px
          </div>
          <q-slider
            v-model="thickness"
            @change="changeThickness"
            :min="0"
            :max="100"
            :step="1"
            color="primary"
          />
        </div>
      </q-item>
      <q-item style="width: 300px">
        <div class="full-width">
          <div>
            Opacity:
            <input
              v-model="opacity"
              @change="changeOpacity"
              style="width: 3em"
            />%
          </div>
          <q-slider
            v-model="opacity"
            @change="changeOpacity"
            :min="0"
            :max="100"
            :step="1"
            color="primary"
          />
        </div>
      </q-item>
      <q-item class="row justify-end q-mb-sm">
        <q-btn
          v-close-popup
          dense
          square
          icon="check"
          color="primary"
          :label="$t('confirm')"
          :ripple="false"
        ></q-btn>
      </q-item>
    </q-list>
  </q-btn-dropdown>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps({
  inkThickness: { type: Number, required: true, default: 5 },
  inkOpacity: { type: Number, required: true, default: 100 },
});
const emit = defineEmits(["changeThickness", "changeOpacity"]);

watch(
  () => props.inkThickness,
  (val: number) => {
    thickness.value = val;
  }
);

watch(
  () => props.inkOpacity,
  (val: number) => {
    opacity.value = val;
  }
);

const thickness = ref(5);
const opacity = ref(100);

function changeThickness() {
  if (thickness.value > 100) thickness.value = 100;
  else if (thickness.value < 0) thickness.value = 0;
  else thickness.value = thickness.value;

  emit("changeThickness", thickness.value);
}

function changeOpacity() {
  if (opacity.value > 100) opacity.value = 100;
  else if (opacity.value < 0) opacity.value = 0;
  else opacity.value = opacity.value;

  emit("changeOpacity", opacity.value);
}
</script>
