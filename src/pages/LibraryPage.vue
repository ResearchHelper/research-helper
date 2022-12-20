<template>
  <div>
    <!-- systembarheight: 32px, tab: 36px actionbarheight: 50px -->
    <q-splitter
      style="position: absolute; width: 100%; height: 100%"
      :limits="[0, 30]"
      separator-class="separator"
      v-model="leftMenuSize"
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

  data() {
    return {
      leftMenuSize: 20,
    };
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
