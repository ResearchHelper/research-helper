<template>
  <!-- TODO: render settings here -->
</template>
<script setup lang="ts">
import pluginManager from "src/backend/plugin";
import { ref } from "vue";

const props = defineProps({
  visible: { type: Boolean, reqruied: true },
  itemId: { type: String, required: true },
});

const pluginId = ref(props.itemId);

pluginManager.plugins.value.get(pluginId.value);
</script>
