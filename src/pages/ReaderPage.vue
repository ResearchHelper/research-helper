<template>
  <div>
    <!-- <q-splitter
      :style="'height:' + height + 'px;'"
      separator-class="separator"
      v-model="stateStore.infoPaneSize"
      after-class="overflow-hidden"
      reverse
      :limits="[0, 50]"
    >
      <template v-slot:before> <PDFReader /> </template>
      <template v-slot:after> <InfoPane /> </template>
    </q-splitter> -->
    <PDFReader class="reader" />
  </div>
</template>

<script>
import { useStateStore } from "src/stores/appState";

// import InfoPane from "src/components/InfoPane.vue";
import PDFReader from "src/components/pdfreader/PDFReader.vue";

export default {
  components: {
    // InfoPane,
    PDFReader,
  },

  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  data() {
    return {
      // layout
      height: window.innerHeight - 32, //- 50,
    };
  },

  mounted() {
    // compute layout height
    this.computeHeight();
    window.addEventListener("resize", this.computeHeight);
  },

  methods: {
    computeHeight() {
      this.height = window.innerHeight - 32; //- 50;
    },
  },
};
</script>

<style lang="scss">
.separator {
  &:hover {
    width: 5px;
    background-color: $primary;
  }
  &:active {
    width: 5px;
    background-color: $primary;
  }
}

.reader {
  height: $page-height;
}
</style>
