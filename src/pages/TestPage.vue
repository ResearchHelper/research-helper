<template>
  <q-btn
    v-if="btn"
    :icon="btn.icon"
    @click="btn.onClick"
  ></q-btn>
  <div id="view-example-plugin"></div>
</template>

<script setup lang="ts">
interface Button {
  icon: string;
  onClick: () => void;
}
interface View {
  mount: (parent: HTMLElement) => void;
}

import { ref, onMounted } from "vue";

const componentName = "TestPage";
const btn = ref<Button | undefined>(undefined);
// const view = ref<View | undefined>(undefined);

const id = "example-plugin";
window.pluginAPI.initPlugin(id);
let btns = window.pluginAPI.getBtns(id) as Button[];
if (btns.length != 0) {
  btn.value = btns[0];
}
onMounted(() => {
  let div = document.getElementById(`view-${id}`) as HTMLElement;
  let views = window.pluginAPI.getViews(id) as Array<View> | undefined;
  if (views && views.length > 0) {
    console.log(views);
    views[0].mount(div);
  }
});
</script>
