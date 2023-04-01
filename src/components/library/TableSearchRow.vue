<template>
  <q-tr>
    <q-td colspan="100%">
      <div
        style="font-size: 0.8rem"
        :style="`width: ${width}px;`"
        class="q-px-lg ellipsis text-grey"
        v-html="text"
      ></div>
    </q-td>
  </q-tr>
</template>
<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: { text: String, width: Number },
});
</script>
