<template>
  <q-btn-dropdown
    dense
    split
    unelevated
    size="0.8rem"
    :ripple="false"
    icon="bi-eraser-fill"
    padding="none"
    @click="$emit('setEraserTool')"
    data-cy="btn-dropdown"
  >
    <template v-slot:label>
      <q-tooltip>{{ $t("eraser") }}</q-tooltip>
    </template>
    <q-list dense>
      <q-item class="q-mt-sm justify-center">
        <q-btn-toggle
          class="full-width"
          dense
          square
          spread
          no-caps
          :ripple="false"
          :model-value="eraserType"
          :options="[
            { label: t('strok-eraser'), value: EraserType.STROKE },
            { label: t('pixel-eraser'), value: EraserType.PIXEL },
          ]"
          @update:model-value="(type) => $emit('update:eraserType', type)"
        />
      </q-item>
      <q-item
        style="width: 300px"
        :disable="eraserType !== EraserType.PIXEL"
      >
        <div class="full-width q-pt-sm">
          <div>
            {{ $t("thickness") + ":" }}
            <input
              v-model="thickness"
              style="width: 3em"
              type="number"
              :disabled="eraserType !== EraserType.PIXEL"
              data-cy="input"
            />px
          </div>
          <q-slider
            v-model="thickness"
            :min="5"
            :max="30"
            :step="1"
            :disable="eraserType !== EraserType.PIXEL"
            color="primary"
            data-cy="slider"
          />
        </div>
      </q-item>
    </q-list>
  </q-btn-dropdown>
</template>
<script setup lang="ts">
import { EraserType } from "src/backend/database";
import { PropType, computed } from "vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n({ useScope: "global" });

const props = defineProps({
  eraserType: {
    type: String as PropType<EraserType>,
    required: true,
  },
  eraserThickness: { type: Number, required: true },
});
const emit = defineEmits([
  "update:eraserType",
  "update:eraserThickness",
  "setEraserTool",
]);

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
