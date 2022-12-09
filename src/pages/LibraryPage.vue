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
          v-model="stateStore.rightMenuSize"
        >
          <template v-slot:before>
            <TableView />
          </template>
          <template v-slot:after>
            <RightMenu />
          </template>
        </q-splitter>
      </template>
    </q-splitter>
  </div>
</template>

<script>
import { useStateStore } from "src/stores/appState";
import TableView from "../components/TableView.vue";
import TreeView from "../components/TreeView.vue";
import RightMenu from "../components/RightMenu.vue";

export default {
  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  components: {
    TableView,
    TreeView,
    RightMenu,
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
