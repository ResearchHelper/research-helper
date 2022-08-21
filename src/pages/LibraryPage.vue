<template>
  <div>
    <ActionBar />
    <!-- window-height class is not suitable here since we have a bar -->
    <q-splitter
      :style="'height:' + height + 'px; overflow: auto;'"
      :limits="[0, 30]"
      separator-class="separator"
      v-model="stateStore.leftMenuSize"
    >
      <template v-slot:before>
        <TreeView />
      </template>
      <template v-slot:after>
        <q-splitter
          reverse
          :limits="[0, 60]"
          separator-class="separator"
          v-model="stateStore.infoPaneSize"
        >
          <template v-slot:before>
            <TableView />
          </template>
          <template v-slot:after>
            <InfoPane />
          </template>
        </q-splitter>
      </template>
    </q-splitter>
  </div>
</template>

<script>
import { useStateStore } from "src/stores/appState";
import ActionBar from "../components/ActionBar.vue";
import TableView from "../components/TableView.vue";
import TreeView from "../components/TreeView.vue";
import InfoPane from "../components/InfoPane.vue";

export default {
  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  components: {
    ActionBar,
    TableView,
    TreeView,
    InfoPane,
  },

  data() {
    return {
      leftMenuSize: 20,
      infoPaneSize: 25,

      height: window.innerHeight - 50,
    };
  },

  mounted() {
    this.computeHeight();
    window.addEventListener("resize", this.computeHeight);
  },

  methods: {
    computeHeight() {
      this.height = window.innerHeight - 50;
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
</style>
