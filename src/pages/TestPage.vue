<template>
  <q-tree
    :nodes="simple"
    node-key="label"
  >
    <template v-slot:default-header="prop">
      <div
        @click.stop
        @keypress="test"
      >
        <q-input v-model="prop.node.label" />
      </div>
    </template>
  </q-tree>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps({
  visible: Boolean,
  itemId: { type: String, required: true },
});

const simple = ref([
  {
    label: "root",
    children: [
      {
        label: "a",
      },
      {
        label: "b",
      },
      {
        label: "c",
      },
    ],
  },
]);

const label = ref("");

const test = (e: KeyboardEvent) => {
  console.log(e);
  if (e.code == "Space") {
    console.log("here");
    // e.preventDefault();
    // e.stopImmediatePropagation();
    e.stopPropagation();
  }
};
</script>
