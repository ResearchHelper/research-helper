<template>
  <q-tr>
    <q-td colspan="100%">
      <div
        style="font-size: 0.8rem"
        :style="`width: ${width}px;`"
        class="q-px-lg ellipsis text-grey"
        v-html="text"
        data-cy="text"
      ></div>
    </q-td>
  </q-tr>
</template>
<script setup lang="ts">
const props = defineProps({ text: String, width: Number });
</script>
