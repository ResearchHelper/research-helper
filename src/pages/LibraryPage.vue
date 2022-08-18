<template>
  <div>
    <ActionBar />
    <!-- window-height class is not suitable here since we have a bar -->
    <q-splitter
      class="window-height"
      v-model="leftMenuSize"
    >
      <template v-slot:before>
        <TreeView />
      </template>
      <template v-slot:after>
        <q-splitter
          reverse
          v-model="infoPaneSize"
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
import ActionBar from "../components/ActionBar.vue";
import TableView from "../components/TableView.vue";
import TreeView from "../components/TreeView.vue";
import InfoPane from "../components/InfoPane.vue";

export default {
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
    };
  },
};
</script>

<style></style>
