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
          ref="tree"
          :draggingProjectId="draggingProjectId"
          @exportFolder="
            (folder) => {
              this.folder = folder;
              this.showDialog = true;
            }
          "
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
              @toggleRightMenu="(visible) => toggleRightMenu(visible)"
              @dragProject="(key) => onDragProject(key)"
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

    <ExportDialog
      v-model:show="showDialog"
      @confirm="exportFolder"
    />
  </div>
</template>

<script>
import TableView from "src/components/library/TableView.vue";
import TreeView from "src/components/library/TreeView.vue";
import ExportDialog from "src/components/library/ExportDialog.vue";
import MetaInfoTab from "src/components/MetaInfoTab.vue";

import { getProjectsByFolderId } from "src/backend/project/project";
import { useStateStore } from "src/stores/appState";
import { exportFile } from "quasar";
import Cite from "citation-js";

export default {
  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  components: {
    TableView,
    TreeView,
    ExportDialog,
    MetaInfoTab,
  },

  data() {
    return {
      treeViewSize: 20,
      rightMenuSize: 0,
      prvRightMenuSize: 25,

      draggingProjectId: "",

      showDialog: false,
      folder: null,
    };
  },

  methods: {
    /**
     * Update an entry in TableView
     * @param {Object} project
     */
    updateProject(project) {
      this.$refs.table.updateProject(project);
    },

    /**
     * As a bridge to notify TreeView about the drag event
     * @param {string} key
     */
    onDragProject(key) {
      this.draggingProjectId = key;
      if (!!!key) this.$refs.tree.onDragEnd(null);
    },

    /**
     * Toggle RightMenu and record its size
     * @param {boolean} visible
     */
    toggleRightMenu(visible) {
      if (visible) {
        this.rightMenuSize = this.prvRightMenuSize;
      } else {
        // record the rightmenu size for next use
        this.prvRightMenuSize = this.rightMenuSize;
        this.rightMenuSize = 0;
      }
    },

    /**
     * Export a folder as a collection of references
     * @param {Object} folder
     */
    async exportFolder() {
      if (!!!this.folder) return;

      let projects = await getProjectsByFolderId(this.folder._id);
      const data = await Cite.async(projects.map((p) => p.doi));
      let bibtex = data.format("bibtex");
      let status = exportFile(`${this.folder.label}.bib`, bibtex, {
        mimeType: "text/plain",
      });
      console.log(status);
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
