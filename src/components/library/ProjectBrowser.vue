<template>
  <ImportDialog
    v-model:show="importDialog"
    @confirm="(isCreateFolder) => addProjectsByCollection(isCreateFolder)"
  />
  <ExportDialog
    v-model:show="exportFolderDialog"
    @confirm="(format, options) => exportFolder(format, options)"
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

  <q-file
    :multiple="false"
    :append="false"
    :accept="'.pdf'"
    style="display: none"
    @update:model-value="(file) => attachFile(file)"
    ref="filePicker"
  />

  <q-splitter
    style="position: absolute; width: 100%; height: 100%"
    :limits="[0, 30]"
    separator-class="q-splitter-separator"
    v-model="treeViewSize"
  >
    <template v-slot:before>
      <TreeView
        style="background: var(--color-library-treeview-bkgd)"
        :draggingProjectId="draggingProjectId"
        @exportFolder="(folder) => showExportFolderDialog(folder)"
        ref="tree"
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
            style="
              min-height: 36px;
              background: var(--color-library-toolbar-bkgd);
            "
            v-model:searchString="searchString"
            :rightMenuSize="rightMenuSize"
            @addEmptyProject="addEmptyProject"
            @addByFiles="addProjectsByFiles"
            @addByCollection="(collection) => showImportDialog(collection)"
            @showIdentifierDialog="showIdentifierDialog(true)"
            @refreshTable="getProjects"
            @toggleRightMenu="(visible) => toggleRightMenu(visible)"
            ref="actionBar"
          />
          <!-- actionbar height 36px, table view is 100%-36px -->
          <TableView
            v-model:projects="projects"
            v-model:selectedProject="selectedProject"
            :searchString="searchString"
            style="
              position: absolute;
              height: calc(100% - 36px);
              width: 100%;
              background: var(--color-library-tableview-bkgd);
            "
            @dragProject="(key) => onDragProject(key)"
            @attachFile="$refs.filePicker"
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
            >
              <q-tooltip>{{ $t("info") }}</q-tooltip>
            </q-tab>
          </q-tabs>
          <!-- q-tab height 36px -->
          <q-tab-panels
            style="
              height: calc(100% - 36px);
              background: var(--color-rightmenu-tab-panel-bkgd);
            "
            model-value="metaInfoTab"
          >
            <q-tab-panel name="metaInfoTab">
              <MetaInfoTab
                v-if="!!rightMenuSize && !$refs.table.isClickingPDF"
                v-model:project="selectedProject"
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
import ImportDialog from "src/components/library/ImportDialog.vue";

import {
  addProject,
  updateProject,
  updateProjectByMeta,
  getProject,
  getProjectsByFolderId,
  deleteProject,
} from "src/backend/project/project";
import { getNotes } from "src/backend/project/note";
import { createEdge, updateEdge, deleteEdge } from "src/backend/project/graph";
import { useStateStore } from "src/stores/appState";
import { getMeta, exportMeta, importMeta } from "src/backend/project/meta";
import { copyFile } from "src/backend/project/file";

export default {
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
    ImportDialog,
  },

  data() {
    return {
      searchString: "",
      projects: [],
      selectedProject: null,

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

      importDialog: false,
      collection: null,

      // file dialog
      replaceStoredCopy: false,
    };
  },

  watch: {
    async "stateStore.selectedFolderId"(folderId, _) {
      await this.getProjects();
    },
  },

  async mounted() {
    this.$bus.on("showDeleteDialog", (project, deleteFromDB) => {
      this.deleteDialog = true;
      this.project = project;
      this.deleteFromDB = deleteFromDB;
    });

    this.$bus.on("showSearchMetaDialog", () => {
      this.showIdentifierDialog(false);
    });

    this.$bus.on("showFileDialog", (replaceStoredCopy) => {
      this.$refs.filePicker.$el.click();
      this.replaceStoredCopy = replaceStoredCopy;
    });

    this.getProjects();
  },

  beforeUnmount() {
    this.$bus.off("showDeleteDialog");
    this.$bus.off("showSearchMetaDialog");
    this.$bus.off("showFileDialog");
  },

  methods: {
    /************************************************
     * Projects (get, add, delete, attachFile)
     ************************************************/

    async getProjects() {
      // get projects and their notes
      this.projects = await getProjectsByFolderId(
        this.stateStore.selectedFolderId
      );
      for (let i in this.projects) {
        // notes are the children of project
        this.projects[i].children = await getNotes(this.projects[i]._id);
      }
    },

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

    showImportDialog(collection) {
      this.importDialog = true;
      this.collection = collection;
    },

    /**
     * Add an empty project to table
     */
    async addEmptyProject() {
      // udpate db
      let project = await addProject(this.stateStore.selectedFolderId);
      await createEdge(project);

      // update ui
      this.projects.push(project);
    },

    /**
     * Add projects by importing files
     * @param {File[]} files
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
          this.projects.push(project);
        } catch (error) {
          this.error = error;
          this.errorDialog = true;
        }
      }
    },

    /**
     * Add projects by a collection file (.bib, .ris, etc...)
     * @param {boolean} isCreateFolder
     */
    async addProjectsByCollection(isCreateFolder) {
      // create folder if user wants to
      if (isCreateFolder) {
        let rootNode = this.$refs.tree.$refs.tree.getNodeByKey("library");
        let folderName = window.path.basename(
          this.collection.name,
          window.path.extname(this.collection.name)
        );
        let focus = true;
        await this.$refs.tree.addFolder(rootNode, folderName, focus);
      }

      await this.$nextTick(); //wait until ui actions settled

      let metas = await importMeta(this.collection.path);
      for (let meta of metas) {
        // add a new project to db and update it with meta
        let project = await addProject(this.stateStore.selectedFolderId);
        project = await updateProjectByMeta(project, meta);
        await createEdge(project);

        // update ui
        this.projects.push(project);
      }

      this.importDialog = false;
      this.collection = null;
    },

    async processIdentifier(identifier) {
      if (!identifier) return;

      try {
        let metas = await getMeta(identifier, "json");
        let meta = metas[0];

        if (this.createProject) {
          // add a new project to db and update it with meta
          let project = await addProject(this.stateStore.selectedFolderId);
          project = await updateProjectByMeta(project, meta);
          await createEdge(project);

          // update ui
          this.projects.push(project);
        } else {
          // update an existing project meta
          let project = await getProject(this.stateStore.selectedItemId);
          project = await updateProjectByMeta(project, meta);
          let sourceNode = {
            id: project._id,
            label: project.title,
            type: "project",
          };
          await updateEdge(project._id, { sourceNode: sourceNode });

          // update projectree ui
          this.$bus.emit("updateProject", row);
        }
      } catch (error) {
        this.error = error;
        this.errorDialog = true;
      }
    },

    /**
     * Delete a project from the current folder,
     * if deleteFromDB is true, delete the project from database and remove the actual files
     */
    async deleteProject() {
      // update ui
      this.projects = this.projects.filter(
        (p) => p._id != this.selectedProject._id
      );
      // update projectTree ui
      this.$bus.emit("deleteProject", this.selectedProject._id);

      // update db
      await this.$nextTick(); // wait until the ui closes all windows
      let notes = await getNotes(this.selectedProject._id);
      await deleteProject(
        this.selectedProject._id,
        this.deleteFromDB,
        this.stateStore.selectedFolderId
      );
      if (this.deleteFromDB) {
        await deleteEdge(this.selectedProject._id);
        for (let note of notes) {
          await deleteEdge(note._id);
        }
      }
    },

    /**
     * Attach file to a project
     * @param {File} file
     */
    async attachFile(file) {
      let dstPath = file.path;
      if (this.replaceStoredCopy)
        dstPath = await copyFile(file.path, this.row._id);
      this.selectedProject.path = dstPath;
      let row = await updateProject(this.selectedProject);
      this.selectedProject._rev = row._rev;
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

    /**********************************************************
     * TreeView
     **********************************************************/

    showExportFolderDialog(folder) {
      this.folder = folder;
      this.exportFolderDialog = true;
    },

    /**
     * Export a folder as a collection of references
     * @param {string} format - citation.js suported format
     * @param {Object} options - extra options
     */
    async exportFolder(format, options) {
      if (!!!this.folder) return;

      await exportMeta(this.folder, format, options);
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
  },
};
</script>
