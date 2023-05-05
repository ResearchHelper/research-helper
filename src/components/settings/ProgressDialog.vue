<template>
  <q-dialog
    v-model="visible"
    persistent
  >
    <q-card style="width: 50vw">
      <q-card-section>
        <div class="text-h6">{{ $t("moving-files") }}</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-linear-progress
          size="1rem"
          :value="progress"
          animation-speed="0"
        >
          <div class="absolute-full flex flex-center">
            <q-badge color="transparent">
              {{ Math.round(progress * 100) }} %
            </q-badge>
          </div>
        </q-linear-progress>
        <div
          v-for="(error, index) in errors"
          :key="index"
          class="text-negative"
        >
          {{ error }}
        </div>
        <div v-show="progress > 0.999">
          {{ $t("files-were-successfully-transfer-to-new-path") }}
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          flat
          :disable="progress < 0.999"
          :ripple="false"
          label="OK"
          v-close-popup
        >
        </q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
<script setup lang="ts">
import { computed, PropType } from "vue";

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  progress: { type: Number, required: true },
  errors: Object as PropType<Error[]>,
});
const emit = defineEmits(["update:modelValue"]);
const visible = computed({
  get() {
    return props.modelValue;
  },
  set(visibility: boolean) {
    emit("update:modelValue", visibility);
  },
});
</script>
