<template>
  <q-card
    flat
    bordered
    square
    class="card q-mb-sm row items-center justify-between"
  >
    <q-card-section class="q-py-none">
      <div class="text-subtitle1 text-bold">
        {{ meta.name }}
        <q-icon
          name="bi-star"
          class="q-ml-md"
        />
        {{ star }}
      </div>
      <div>By {{ meta.author }}</div>
      <div>Version: {{ meta.version }}</div>
      <div class="q-mb-xs">{{ meta.description }}</div>
    </q-card-section>
    <q-card-actions v-if="installed">
      <q-btn
        flat
        dense
        square
        no-caps
        size="sm"
        :ripple="false"
        icon="bi-gear"
      >
        <q-tooltip>Options</q-tooltip>
      </q-btn>
      <q-toggle
        v-model="enabled"
        color="primary"
      />
    </q-card-actions>
    <q-card-actions v-else>
      <q-btn
        dense
        square
        no-caps
        :ripple="false"
        color="primary"
      >
        Install
      </q-btn>
    </q-card-actions>
  </q-card>
</template>
<script setup lang="ts">
import { onMounted, ref, PropType, computed } from "vue";
import { PluginMeta } from "src/backend/database";
const props = defineProps({
  meta: { type: Object as PropType<PluginMeta>, required: true },
  installed: { type: Boolean, required: true },
});
const emit = defineEmits(["togglePlugin"]);
const star = ref<number | null>(null);
const enabled = computed({
  get() {
    return !!props.meta.enabled;
  },
  set(value: boolean) {
    emit("togglePlugin", value);
  },
});
onMounted(async () => {
  try {
    let response = await fetch(
      "https://api.github.com/repos/ResearchHelper/research-helper"
    );
    let data = await response.json();
    star.value = data.stargazers_count;
  } catch (error) {
    star.value = null;
  }
});
</script>
<style scoped>
.card {
  background: var(--color-settings-card-bkgd);
}
</style>
