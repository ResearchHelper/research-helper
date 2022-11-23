<template>
  <div>
    <!-- systembarheight: 32px, actionbarheight: 50px -->
    <q-splitter
      style="height: calc(100vh - 32px)"
      :limits="[0, 30]"
      separator-class="separator"
      v-model="stateStore.leftMenuSize"
    >
      <template v-slot:before>
        <TreeView />
      </template>
      <template v-slot:after>
        <q-splitter
          style="overflow: hidden"
          reverse
          :limits="[0, 60]"
          separator-class="separator"
          v-model="stateStore.infoPaneSize"
        >
          <template v-slot:before>
            <ActionBar />
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
