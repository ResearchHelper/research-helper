<template>
  <q-btn
    dense
    flat
    square
    :ripple="false"
    icon="visibility"
    size="0.7rem"
    padding="xs"
    data-cy="btn-dropdown"
  >
    <q-tooltip>{{ $t("view") }}</q-tooltip>
    <q-menu data-cy="menu-dropdown">
      <q-list dense>
        <q-item class="row justify-between items-center">
          <q-btn
            dense
            flat
            :ripple="false"
            icon="expand"
            class="rotate-90"
            @click="$emit('changeScale', { scaleValue: 'page-width' })"
            data-cy="btn-page-width"
          >
            <q-tooltip>{{ $t("page-width") }}</q-tooltip>
          </q-btn>
          <q-btn
            dense
            flat
            :ripple="false"
            icon="expand"
            @click="$emit('changeScale', { scaleValue: 'page-height' })"
            data-cy="btn-page-height"
          >
            <q-tooltip>{{ $t("page-height") }}</q-tooltip>
          </q-btn>
        </q-item>
        <q-separator />
        <q-item class="row justify-center items-center">
          <q-btn
            dense
            flat
            :ripple="false"
            icon="zoom_out"
            @click="$emit('changeScale', { delta: -0.1 })"
            data-cy="btn-zoom-out"
          >
            <q-tooltip>{{ $t("zoom-out") }}</q-tooltip>
          </q-btn>
          <div data-cy="scale">
            {{ Math.trunc(currentScale * 100) + "%" }}
          </div>
          <q-btn
            dense
            flat
            :ripple="false"
            icon="zoom_in"
            @click="$emit('changeScale', { delta: 0.1 })"
            data-cy="btn-zoom-in"
          >
            <q-tooltip>{{ $t("zoom-in") }}</q-tooltip>
          </q-btn>
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
              { label: $t('no-spreads'), value: 0 },
              { label: $t('odd-spreads'), value: 1 },
              { label: $t('even-spreads'), value: 2 },
            ]"
            :model-value="spreadMode"
            @update:model-value="(mode: number) => $emit('changeSpreadMode',mode)"
            data-cy="btn-toggle-spread"
          />
        </q-item>
        <q-separator />
        <q-item class="justify-center">
          <q-btn
            dense
            square
            flat
            :ripple="false"
            :icon="isFullscreen ? 'fullscreen_exit' : 'fullscreen'"
            size="0.9rem"
            padding="none"
            @click="$emit('toggleFullscreen')"
            data-cy="btn-toggle-fullscreen"
          >
            <q-tooltip>{{
              isFullscreen ? $t("exit-full-screen") : $t("enter-full-screen")
            }}</q-tooltip>
          </q-btn>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>
<script setup lang="ts">
const props = defineProps({
  currentScale: { type: Number, required: true },
  spreadMode: { type: Number, required: true },
  isFullscreen: { type: Boolean, required: true },
});
const emit = defineEmits([
  "changeScale",
  "changeSpreadMode",
  "toggleFullscreen",
]);
</script>
