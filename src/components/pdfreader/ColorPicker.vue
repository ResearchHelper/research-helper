<template>
  <div
    class="row justify-between items-center"
    style="width: 128px"
  >
    <q-btn
      v-for="color in colors"
      :key="color"
      :style="`background: ${color}`"
      size="sm"
      padding="sm"
      square
      v-close-popup
      @click="selectColor(color)"
      :data-cy="`btn-${color.slice(1)}`"
    ></q-btn>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
const colors = ref(["#ffff00", "#019a9d", "#e8045a", "#1976d2", "#000000"]);
const emit = defineEmits(["selected"]);
const selectColor = (color: string) => {
  emit("selected", color);
};
</script>
