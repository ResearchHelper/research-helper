<template>
  <ExportDialog
    v-model:show="exportFolderDialog"
    @confirm="exportFolder"
  />
  <IdentifierDialog
    v-model:show="identifierDialog"
    @confirm="(identifier) => processIdentifier(identifier)"
  />
  <DeleteDialog
    v-model:show="deleteDialog"
    :projectTitle="project?.title"
    :deleteFromDB="deleteFromDB"
    @confirm="deleteProject"
  />
  <ErrorDialog
    v-model:show="errorDialog"
    :error="error"
  />

  <q-splitter
    style="position: absolute; width: 100%; height: 100%"
    :limits="[0, 30]"
    separator-class="q-splitter-separator"
    v-model="treeViewSize"
  >
    <template v-slot:before>
      <TreeView
        ref="tree"
        :draggingProjectId="draggingProjectId"
        @exportFolder="(folder) => showExportFolderDialog(folder)"
      />
    </template>
    <template v-slot:after>
      <q-splitter
        style="overflow: hidden"
        reverse
        :limits="[0, 60]"
        separator-class="q-splitter-separator"
        v-model="rightMenuSize"
      >
        <template v-slot:before>
          <ActionBar
            v-model:searchString="searchString"
            :rightMenuSize="rightMenuSize"
            @toggleRightMenu="(visible) => toggleRightMenu(visible)"
            @addEmptyProject="addEmptyProject"
            @addByFiles="addProjectsByFiles"
            @showIdentifierDialog="showIdentifierDialog(true)"
            ref="actionBar"
          />
          <TableView
            :searchString="searchString"
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
                :projectId="stateStore.selectedItemId"
                @updateProject="updateProjectUI"
              />
            </q-tab-panel>
          </q-tab-panels>
        </template>
      </q-splitter>
    </template>
  </q-splitter>
</template>

<script>
import ActionBar from "src/components/library/ActionBar.vue";
import TableView from "src/components/library/TableView.vue";
import TreeView from "src/components/library/TreeView.vue";
import MetaInfoTab from "src/components/MetaInfoTab.vue";
import ExportDialog from "src/components/library/ExportDialog.vue";
import IdentifierDialog from "src/components/library/IdentifierDialog.vue";
import DeleteDialog from "src/components/library/DeleteDialog.vue";
import ErrorDialog from "src/components/ErrorDialog.vue";
import ErrorDialog from "src/components/ErrorDialog.vue";

import {
  addProject,
  updateProject,
  updateProjectByMeta,
  getProject,
} from "src/backend/project/project";
import { createEdge } from "src/backend/project/graph";
import { useStateStore } from "src/stores/appState";
import { exportFile } from "quasar";
import { getMeta, exportMeta } from "src/backend/project/meta";
import { copyFile } from "src/backend/project/file";

export default {
  // every page should have two props
  props: { itemId: String, visible: Boolean },

  // every page should have two props
  props: { itemId: String, visible: Boolean },

  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  components: {
    ActionBar,
    TableView,
    TreeView,
    ExportDialog,
    MetaInfoTab,
    IdentifierDialog,
    DeleteDialog,
    ErrorDialog,
    ErrorDialog,
  },

  data() {
    return {
      searchString: "",
      treeViewSize: 20,
      rightMenuSize: 0,
      prvRightMenuSize: 25,

      draggingProjectId: "",

      exportFolderDialog: false,
      folder: null,

      deleteDialog: false,
      project: null,
      deleteFromDB: false,

      identifierDialog: false,
      createProject: false,

      errorDialog: false,
      error: null,
    };
  },

  mounted() {
    this.$bus.on("showDeleteDialog", (project, deleteFromDB) => {
      this.deleteDialog = true;
      this.project = project;
      this.deleteFromDB = deleteFromDB;
    });

    this.$bus.on("showSearchMetaDialog", () => {
      this.showIdentifierDialog(false);
    });
  },

  beforeUnmount() {
    this.$bus.off("showDeleteDialog");
    this.$bus.off("showSearchMetaDialog");
  },

  methods: {
    /************************************************
     * ActionBar
     ************************************************/

    /**
     * Open identifier dialog.
     * If createProject is true, the identifier will be used to create a new project
     * otherwise the identifier will be used to update an existing project
     * @param {boolean} createProject
     */
    showIdentifierDialog(createProject) {
      this.identifierDialog = true;
      this.createProject = createProject;
    },

    /**
     * Add an empty project to table
     */
    async addEmptyProject() {
      // udpate db
      let project = await addProject(this.stateStore.selectedFolderId);
      await createEdge(project);

      // update ui
      this.$refs.table.addProject(project);
    },

    /**
     * Add projects by importing files
     * @param {Array} files
     */
    async addProjectsByFiles(files) {
      for (let file of files) {
        try {
          // update db
          let project = await addProject(this.stateStore.selectedFolderId);
          project.path = await copyFile(file.path, project._id);
          project.title = window.path.basename(project.path, ".pdf");
          project = await updateProject(project);
          await createEdge(project);

          // update ui
          this.$refs.table.addProject(project);
        } catch (error) {
          this.error = error;
          this.errorDialog = true;
        }
      }
    },

    // /**
    //  * Modify the meta of a project object
    //  * @param {Object} project
    //  * @param {Object} meta
    //  * @returns {Object} modifiedProject
    //  */
    // modifyProjectByMeta(project, meta) {
    //   project.type = meta.type || "";
    //   project.title = meta.title || "";
    //   project.author = meta.author || [];
    //   project.abstract = meta.abstract || "";
    //   project.year = meta.year || null;
    //   project.DOI = meta.DOI || "";
    //   project.URL = meta.URL || "";
    //   project.publisher = meta.publisher || "";
    //   return project;
    // },

    async processIdentifier(identifier) {
      if (!identifier) return;

      try {
        let metas = await getMeta(identifier);
        let meta = metas[0];

        if (this.createProject) {
          // add a new project to db and update it with meta
          let project = await addProject(this.stateStore.selectedFolderId);
          project = await updateProjectByMeta(project, meta);
          await createEdge(project);

          // update ui
          this.$refs.table.addProject(project);
        } else {
          // update an existing project meta
          let project = await getProject(this.stateStore.selectedItemId);
          project = await updateProjectByMeta(project, meta);

          // update ui
          this.updateProjectUI(project);
        }
      } catch (error) {
        this.error = error;
        this.errorDialog = true;
      }
    },

    /**************************************************
     * MetaInfoTab
     **************************************************/

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
     * Update the UI of an entry in TableView
     * @param {Object} project
     */
    updateProjectUI(project) {
      this.$refs.table.updateProject(project);
    },

    /************************************************************
     * TableView
     ************************************************************/

    /**
     * As a bridge to notify TreeView about the drag event
     * @param {string} key
     */
    onDragProject(key) {
      this.draggingProjectId = key;
      if (!!!key) this.$refs.tree.onDragEnd(null);
    },

    deleteProject() {
      this.$refs.table.deleteProject(this.project, this.deleteFromDB);
    },

    /**********************************************************
     * TreeView
     **********************************************************/

    showExportFolderDialog(folder) {
      this.folder = folder;
      this.exportFolderDialog = true;
    },

    /**
     * Export a folder as a collection of references
     * @param {Object} folder
     */
    async exportFolder() {
      if (!!!this.folder) return;

      let bibtex = await exportMeta(this.folder._id, "bibtex");
      let status = exportFile(`${this.folder.label}.bib`, bibtex, {
        mimeType: "text/plain",
      });
    },
  },
};
</script>
