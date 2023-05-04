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
            <q-tab-panel
              name="metaInfoTab"
              class="q-pa-none"
            >
              <MetaInfoTab
                v-if="!!rightMenuSize && !($refs.table as typeof TableView).isClickingPDF"
                :project="selectedProject"
              />
            </q-tab-panel>
          </q-tab-panels>
        </template>
      </q-splitter>
    </template>
  </q-splitter>
</template>

<script lang="ts">
// types
import { defineComponent, computed } from "vue";
import { Folder, Project, Note } from "src/backend/database";
import {
  KEY_metaDialog,
  KEY_deleteDialog,
  KEY_attachFile,
  KEY_renameFromMeta,
  KEY_addNote,
  KEY_renameNote,
  KEY_deleteNote,
} from "./injectKeys";
// components
import ActionBar from "src/components/library/ActionBar.vue";
import TableView from "src/components/library/TableView.vue";
import TreeView from "src/components/library/TreeView.vue";
import MetaInfoTab from "src/components/MetaInfoTab.vue";
import ExportDialog from "src/components/library/ExportDialog.vue";
import IdentifierDialog from "src/components/library/IdentifierDialog.vue";
import DeleteDialog from "src/components/library/DeleteDialog.vue";
import ErrorDialog from "src/components/ErrorDialog.vue";
import ImportDialog from "src/components/library/ImportDialog.vue";
// db
import {
  addProject,
  updateProject,
  updateProjectByMeta,
  getProject,
  getProjectsByFolderId,
  deleteProject,
} from "src/backend/project/project";
import {
  getNotes,
  addNote,
  updateNote,
  deleteNote,
} from "src/backend/project/note";
import {
  createEdge,
  updateEdge,
  deleteEdge,
  appendEdgeTarget,
  updateEdgeTarget,
  deleteEdgeTarget,
} from "src/backend/project/graph";
import { useStateStore } from "src/stores/appState";
import { getMeta, exportMeta, importMeta } from "src/backend/project/meta";
import { copyFile, renameFile } from "src/backend/project/file";
// util (to scan identifier in PDF)
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "node_modules/pdfjs-dist/build/pdf.worker.min.js";

export default defineComponent({
  setup() {
    const stateStore = useStateStore();
    // also return TableView so I can use its type in template
    return { stateStore, TableView };
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
      projects: [] as Project[],
      selectedProject: undefined as Project | undefined,

      treeViewSize: 20,
      rightMenuSize: 0,
      prvRightMenuSize: 25,

      draggingProjectId: "",

      exportFolderDialog: false,
      folder: null as Folder | null,

      deleteDialog: false,
      project: null as Project | null,
      deleteFromDB: false,

      identifierDialog: false,
      createProject: false,

      errorDialog: false,
      error: null as Error | null,

      importDialog: false,
      collection: null as File | null,
    };
  },

  watch: {
    async "stateStore.selectedFolderId"(folderId, _) {
      await this.getProjects();
    },
  },

  provide() {
    return {
      // for projectRow
      [KEY_deleteDialog]: this.showDeleteDialog,
      [KEY_metaDialog]: this.showSearchMetaDialog,
      [KEY_addNote]: this.addNote,
      [KEY_attachFile]: this.attachFile,

      // for itemRow
      [KEY_renameNote]: this.renameNote,
      [KEY_deleteNote]: this.deleteNote,
      [KEY_renameFromMeta]: this.renameFromMeta,
    };
  },

  mounted() {
    this.getProjects();
  },

  methods: {
    /************************************************
     * Projects (get, add, delete, update, attachFile, renameFromMeta)
     ************************************************/

    /**
     * Delete project
     * @param project
     * @param deleteFromDB
     */
    showDeleteDialog(project: Project, deleteFromDB: boolean) {
      this.deleteDialog = true;
      this.project = project;
      this.deleteFromDB = deleteFromDB;
    },

    /**
     * Update project by meta
     */
    showSearchMetaDialog() {
      let createProject = false;
      this.showIdentifierDialog(createProject);
    },

    async getProjects() {
      this.projects = [];
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
     * @param createProject
     */
    showIdentifierDialog(createProject: boolean) {
      this.identifierDialog = true;
      this.createProject = createProject;
    },

    showImportDialog(collection: File) {
      this.importDialog = true;
      this.collection = collection;
    },

    /**
     * Add an empty project to table
     */
    async addEmptyProject() {
      // udpate db
      let project = (await addProject(
        this.stateStore.selectedFolderId
      )) as Project;
      await createEdge(project);

      // update ui
      this.projects.push(project);
    },

    /**
     * Add projects by importing files
     * @param files - pdfs imported
     */
    async addProjectsByFiles(files: File[]) {
      for (let file of files) {
        try {
          // update db
          let project = (await addProject(
            this.stateStore.selectedFolderId
          )) as Project;
          project.path = (await copyFile(file.path, project._id)) as string;
          project.title = window.path.basename(project.path, ".pdf");
          project = (await updateProject(project)) as Project;

          // get meta
          let buffer = window.fs.readFileSync(file.path);
          let pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
          for (
            let pageNumber = 1;
            pageNumber <= Math.min(10, pdf.numPages);
            pageNumber++
          ) {
            let page = await pdf.getPage(pageNumber);
            let content = await page.getTextContent();
            for (let item of content.items) {
              let identifier = null;
              // match ISBN-10 or ISBN-13
              let isbns = item.str.match(
                /^ISBN.* (?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/
              );
              if (!!isbns)
                identifier = isbns[0].match(
                  /(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+/
                )[0];

              // match DOI
              let dois = item.str.match(/^http.*doi.*/);
              if (!!dois) identifier = dois[0];

              // update project meta
              if (!!identifier) {
                console.log(identifier);
                let metas = await getMeta(identifier, "json");
                let meta = metas[0];
                project = (await updateProjectByMeta(project, meta)) as Project;

                break;
              }
            }
          }

          // create edge
          await createEdge(project);

          // update ui
          this.projects.push(project);
        } catch (error) {
          this.error = error as Error;
          this.errorDialog = true;
          // refresh table
          await this.getProjects();
        }
      }
    },

    /**
     * Add projects by a collection file (.bib, .ris, etc...)
     * @param isCreateFolder
     */
    async addProjectsByCollection(isCreateFolder: boolean) {
      if (this.collection === null) return;
      // create folder if user wants to
      if (isCreateFolder) {
        let treeview = this.$refs.tree as typeof TreeView;
        let rootNode = treeview.$refs.tree.getNodeByKey("library");
        let folderName = window.path.basename(
          (this.collection as File).name,
          window.path.extname(this.collection.name)
        );
        let focus = true;
        await treeview.addFolder(rootNode, folderName, focus);
      }

      await this.$nextTick(); //wait until ui actions settled

      let metas = await importMeta(this.collection.path);
      for (let meta of metas) {
        // add a new project to db and update it with meta
        let project = (await addProject(
          this.stateStore.selectedFolderId
        )) as Project;
        project = (await updateProjectByMeta(project, meta)) as Project;
        await createEdge(project);

        // update ui
        this.projects.push(project);
      }

      this.importDialog = false;
      this.collection = null;
    },

    async processIdentifier(identifier: string) {
      if (!identifier) return;

      try {
        let metas = await getMeta(identifier, "json");
        let meta = metas[0];

        if (this.createProject) {
          // add a new project to db and update it with meta
          let project = (await addProject(
            this.stateStore.selectedFolderId
          )) as Project;
          console.log("project", project);
          project = (await updateProjectByMeta(project, meta)) as Project;
          await createEdge(project);

          // update ui
          this.projects.push(project);
        } else {
          // update an existing project meta
          let project = (await getProject(
            this.stateStore.selectedItemId
          )) as Project;
          project = (await updateProjectByMeta(project, meta)) as Project;
          let sourceNode = {
            id: project._id,
            label: project.title,
            type: "project",
          };
          await updateEdge(project._id, { sourceNode: sourceNode });

          // update tableview UI
          if (this.selectedProject !== undefined) {
            for (let prop in project)
              this.selectedProject[prop] = project[prop];
          }
          // update projectree ui
          this.$bus.emit("updateProject", {
            source: "ProjectBrowser",
            data: this.selectedProject,
          });
        }
      } catch (error) {
        this.error = error as Error;
        this.errorDialog = true;
        // refresh table
        await this.getProjects();
      }
    },

    /**
     * Delete a project from the current folder,
     * if deleteFromDB is true, delete the project from database and remove the actual files
     */
    async deleteProject() {
      if (this.selectedProject === undefined) return;
      // update ui
      this.projects = this.projects.filter(
        (p) => p._id != (this.selectedProject as Project)._id
      );
      // update projectTree ui
      this.$bus.emit("deleteProject", {
        source: "ProjectBrowser",
        data: this.selectedProject._id,
      });

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

    async attachFile(
      replaceStoredCopy: boolean,
      projectId: string,
      index?: number
    ) {
      let filePaths = window.fileBrowser.showFilePicker();
      if (filePaths?.length === 1) {
        // find index
        if (index === undefined)
          index = this.projects.findIndex((p) => p._id === projectId);
        else if (index === -1) index = this.projects.length;

        let dstPath = filePaths[0];
        if (replaceStoredCopy)
          dstPath = (await copyFile(dstPath, projectId)) as string;
        this.projects[index].path = dstPath;
        this.projects[index] = (await updateProject(
          this.projects[index]
        )) as Project;
      }
    },

    /**
     * Rename PDF file form meta
     * @param row
     * @param index
     */
    async renameFromMeta(project: Project, index?: number) {
      if (project.path === undefined) return;
      let author = "";
      let year = project.year || "Unknown";
      let title = project.title;
      let extname = window.path.extname(project.path);
      if (project.author.length === 0) {
        // no author
        author = "Unknown";
      } else {
        // 1 author
        let author0 = project.author[0];
        author = !!author0.family
          ? author0.family
          : (author0.literal as string);

        // more than 1 authors
        if (project.author.length > 1) author += " et al.";
      }
      let fileName = `${author} - ${year} - ${title}${extname}`;

      // update backend
      project.path = renameFile(project.path, fileName);
      project = (await updateProject(project)) as Project;

      // update ui
      if (index === undefined)
        index = this.projects.findIndex((p) => p._id === project._id);
      else if (index === -1) index = this.projects.length;
      this.projects[index] = project;
    },

    /******************************************************
     * Note (add, delete, update)
     *******************************************************/
    async addNote(projectId: string, index?: number) {
      // update db
      let note = (await addNote(projectId)) as Note;
      await createEdge(note);
      await appendEdgeTarget(note.projectId, note);

      // update ui
      if (index === undefined)
        index = this.projects.findIndex((p) => p._id === projectId);
      else if (index === -1) index = this.projects.length;
      // new project does not have children property
      if (!this.projects[index].children)
        this.projects[index].children = [] as Note[];
      this.projects[index].children?.push(note);
      console.log("current project", this.projects[index]);
      this.stateStore.selectedItemId = note._id;

      // update projectTree ui
      this.$bus.emit("updateProject", {
        source: "ProjectBrowser",
        data: this.projects[index],
      });
    },

    async renameNote(note: Note, index?: number) {
      // update db
      note = (await updateNote(note)) as Note;
      let sourceNode = {
        id: note._id,
        label: note.label,
        type: note.dataType,
      };
      await updateEdge(note._id, { sourceNode: sourceNode });
      await updateEdgeTarget(note.projectId, note);

      // update ui
      if (index === undefined)
        index = this.projects.findIndex((p) => p._id === note.projectId);
      else if (index === -1) index = this.projects.length;
      let project = this.projects[index];
      if (project.children === undefined) return;
      let noteIndex = project.children.findIndex((n) => n._id === note._id);
      if (noteIndex !== undefined) project.children[noteIndex] = note;

      this.$bus.emit("updateProject", {
        source: "ProjectBrowser",
        data: project,
      }); // to update ui of projectTree
    },

    async deleteNote(note: Note, index?: number) {
      // update db
      await deleteNote(note._id);
      await deleteEdge(note._id);
      await deleteEdgeTarget(note.projectId, note._id);

      // update ui
      if (index === undefined)
        index = this.projects.findIndex((p) => p._id === note.projectId);
      else if (index === -1) index = this.projects.length;
      let project = this.projects[index];
      if (project.children === undefined) return;
      project.children = project.children.filter((n) => n._id != note._id);
      console.log("project.children after filter", project.children);

      // update projectTree ui
      this.$bus.emit("updateProject", {
        source: "ProjectBrowser",
        data: project,
      });
    },

    /************************************************************
     * TableView
     ************************************************************/

    /**
     * As a bridge to notify TreeView about the drag event
     * @param key
     */
    onDragProject(key: string) {
      this.draggingProjectId = key;
      if (!!!key) (this.$refs.tree as typeof TreeView).onDragEnd(null);
    },

    /**********************************************************
     * TreeView
     **********************************************************/

    showExportFolderDialog(folder: Folder) {
      this.folder = folder;
      this.exportFolderDialog = true;
    },

    /**
     * Export a folder as a collection of references
     * @param format - citation.js suported format
     * @param options - extra options
     */
    async exportFolder(
      format: string,
      options: { format?: string; template?: string }
    ) {
      if (!!!this.folder) return;

      await exportMeta(this.folder, format, options);
    },

    /**************************************************
     * MetaInfoTab
     **************************************************/

    /**
     * Toggle RightMenu and record its size
     * @param visible
     */
    toggleRightMenu(visible: boolean) {
      if (visible) {
        this.rightMenuSize = this.prvRightMenuSize;
      } else {
        // record the rightmenu size for next use
        this.prvRightMenuSize = this.rightMenuSize;
        this.rightMenuSize = 0;
      }
    },
  },
});
</script>
