<template>
  <div>
    <!-- systembarheight: 32px, tab: 36px actionbarheight: 50px -->
    <q-splitter
      style="position: absolute; width: 100%; height: 100%"
      :limits="[0, 30]"
      separator-class="separator"
      v-model="treeViewSize"
    >
      <template v-slot:before>
        <TreeView
          :draggingProjectId="draggingProjectId"
          ref="tree"
        />
      </template>
      <template v-slot:after>
        <q-splitter
          style="overflow: hidden"
          reverse
          :limits="[0, 60]"
          separator-class="separator"
          v-model="rightMenuSize"
        >
          <template v-slot:before>
            <TableView
              :rightMenuSize="rightMenuSize"
              @toggle-right-menu="toggleRightMenu"
              @drag-project="(key) => onDragProject(key)"
              ref="table"
            />
          </template>
          <template v-slot:after>
            <q-tabs
              dense
              indicator-color="transparent"
              active-bg-color="primary"
              model-value="metaInfoTab"
            >
              <q-tab
                name="metaInfoTab"
                icon="info"
                :ripple="false"
              />
            </q-tabs>
            <!-- q-tab height 36px -->
            <q-tab-panels
              style="height: calc(100% - 36px)"
              model-value="metaInfoTab"
            >
              <q-tab-panel name="metaInfoTab">
                <MetaInfoTab
                  v-if="!!rightMenuSize"
                  :projectId="stateStore.selectedProjectId"
                  @updateProject="updateProject"
                />
              </q-tab-panel>
            </q-tab-panels>
          </template>
        </q-splitter>
      </template>
    </q-splitter>
  </div>
</template>

<script>
import { useStateStore } from "src/stores/appState";
import TableView from "src/components/TableView.vue";
import TreeView from "src/components/TreeView.vue";
import MetaInfoTab from "src/components/MetaInfoTab.vue";

export default {
  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  components: {
    TableView,
    TreeView,
    MetaInfoTab,
  },

  data() {
    return {
      treeViewSize: 20,

      prvRightMenuSize: 25,
      rightMenuSize: 0,

      draggingProjectId: "",
    };
  },

  methods: {
    addProject(file) {
      this.$refs.table.addProject(file);
    },

    updateProject(project) {
      this.$refs.table.updateProject(project);
    },

    toggleRightMenu(visible) {
      if (visible) {
        this.rightMenuSize = this.prvRightMenuSize;
      } else {
        // record the rightmenu size for next use
        this.prvRightMenuSize = this.rightMenuSize;
        this.rightMenuSize = 0;
      }
    },

    onDragProject(key) {
      this.draggingProjectId = key;
      if (!!!key) this.$refs.tree.onDragEnd(null);
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
