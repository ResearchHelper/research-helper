<template>
  <div class="full-width row justify-between items-center">
    <q-btn
      v-for="color in colors"
      :key="color"
      :style="`background: ${color}`"
      size="sm"
      padding="sm"
      square
      @click="$emit('selected', color)"
    ></q-btn>
  </div>
</template>

<script>
export default {
  data() {
    return {
      colors: ["#ffff00", "#019a9d", "#d9b801", "#e8045a", "#b2028a"],
    };
  },
};
</script>
