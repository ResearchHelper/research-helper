<template>
  <q-toolbar>
    <q-btn
      v-if="showAddBtn"
      flat
      dense
      square
      icon="add"
      size="0.8rem"
      padding="none"
      @click="togglePluginStore(true)"
    >
      <q-tooltip>Add plugins</q-tooltip>
    </q-btn>
    <q-space v-if="showAddBtn" />
    <q-input
      outlined
      dense
      square
      class="actionbar-input"
      :placeholder="$t('search')"
      type="text"
      v-model="searchText"
      @update:model-value="debounceSearch"
    >
      <template v-slot:append>
        <q-icon
          class="cursor-pointer"
          name="search"
        />
      </template>
    </q-input>
    <q-space />
    <q-btn
      v-if="showCloseBtn"
      flat
      dense
      square
      v-close-popup
      icon="close"
      size="0.8rem"
      padding="none"
    >
      <q-tooltip>Add plugins</q-tooltip>
    </q-btn>
  </q-toolbar>
</template>
<script setup lang="ts">
import { debounce } from "quasar";
import { inject, ref } from "vue";

const props = defineProps({
  showAddBtn: { type: Boolean, required: true },
  showCloseBtn: { type: Boolean, required: true },
});
const emit = defineEmits(["search"]);
const searchText = ref("");
const debounceSearch = debounce((text: string | number | null) => {
  emit("search", typeof text === "number" ? text.toString() : text);
}, 500);
const togglePluginStore = inject("togglePluginStore") as (
  show: boolean
) => void;
</script>
