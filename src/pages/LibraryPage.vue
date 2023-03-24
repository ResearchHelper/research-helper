<template>
  <ProjectBrowser v-if="visible" />
</template>
<script>
import ProjectBrowser from "src/components/library/ProjectBrowser.vue";

export default {
  // every page has two props
  props: { itemId: String, visible: Boolean },
  components: { ProjectBrowser },
};
</script>
