<template>
  <ProjectBrowser v-if="visible" />
</template>
<script>
import { defineComponent } from "vue";
import ProjectBrowser from "src/components/library/ProjectBrowser.vue";

export default defineComponent({
  // every page has two props
  props: { itemId: String, visible: Boolean },
  components: { ProjectBrowser },
});
</script>
