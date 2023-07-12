<template>
  <q-btn-dropdown
    dense
    split
    size="0.8rem"
    :ripple="false"
    icon="bi-eraser-fill"
    padding="none"
    @click="$emit('setEraserTool')"
  >
    <template v-slot:label>
      <q-tooltip>{{ $t("eraser") }}</q-tooltip>
    </template>
    <q-list dense>
      <q-item style="width: 300px">
        <div class="full-width q-pt-sm">
          <div>
            Thickness:
            <input
              v-model="thickness"
              style="width: 3em"
            />px
          </div>
          <q-slider
            v-model="thickness"
            :min="5"
            :max="30"
            :step="1"
            color="primary"
          />
        </div>
      </q-item>
    </q-list>
  </q-btn-dropdown>
</template>
<script setup lang="ts">
import { computed } from "vue";

const props = defineProps({
  eraserThickness: { type: Number, required: true },
});
const emit = defineEmits(["setEraserTool", "update:eraserThickness"]);

const thickness = computed({
  get() {
    return props.eraserThickness;
  },
  set(value: number) {
    if (value > 30) value = 30;
    else if (value < 5) value = 5;
    emit("update:eraserThickness", value);
  },
});
</script>
