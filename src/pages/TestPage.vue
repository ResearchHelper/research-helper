<template>
  <q-btn @click="change">change</q-btn>
  <q-btn @click="deleteVal">delete</q-btn>
  <div
    v-for="item in a"
    :key="item[0]"
  >
    {{ `key = ${item[0]}, item = ${item[1]}` }}
  </div>
</template>
<script setup>
import { ref, reactive } from "vue";

const a = reactive(new Map());

function change() {
  for (let i = 0; i < 10; i++) a.set(i, "text" + i);
}

const deleteVal = () => {
  a.delete(0);
};
</script>
