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
        ref="treeview"
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
            @addByFiles="(filePaths) => addProjectsByFiles(filePaths)"
            @addByCollection="
              (collectionPath) => showImportDialog(collectionPath)
            "
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

<script setup lang="ts">
import {
  ref,
  watch,
  provide,
  onMounted,
  inject,
  onBeforeUnmount,
  nextTick,
} from "vue";
// types
import {
  Folder,
  Project,
  Note,
  NoteType,
  BusEvent,
  Edge,
} from "src/backend/database";
import {
  KEY_metaDialog,
  KEY_deleteDialog,
  KEY_attachFile,
  KEY_renameFromMeta,
  KEY_addNote,
  KEY_renameNote,
  KEY_deleteNote,
} from "./injectKeys";
import { TextItem } from "pdfjs-dist/types/src/display/api";
import { EventBus } from "quasar";
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
  addProject as addProjectDB,
  updateProject as updateProjectDB,
  updateProjectByMeta as updateProjectByMetaDB,
  getProject as getProjectDB,
  getProjectsByFolderId,
  deleteProject as deleteProjectDB,
} from "src/backend/project/project";
import {
  getNotes as getNotesDB,
  addNote as addNoteDB,
  updateNote as updateNoteDB,
  deleteNote as deleteNoteDB,
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

const componentName = "ProjectBrowser";
const stateStore = useStateStore();

/*********************************
 * Data
 *********************************/
// component refs
const treeview = ref<typeof TreeView | null>(null);

// data
const searchString = ref("");
const projects = ref<Project[]>([]);
const selectedProject = ref<Project | undefined>(undefined);

const treeViewSize = ref(20);
const rightMenuSize = ref(0);
const prvRightMenuSize = ref(25);

const draggingProjectId = ref("");

const exportFolderDialog = ref(false);
const folder = ref<Folder | null>(null);

const deleteDialog = ref(false);
const project = ref<Project | null>(null);
const deleteFromDB = ref(false);

const identifierDialog = ref(false);
const createProject = ref(false);

const errorDialog = ref(false);
const error = ref<Error | undefined>(undefined);

const importDialog = ref(false);
const collectionPath = ref<string>("");

watch(
  () => stateStore.selectedFolderId,
  async (folderId: string) => {
    await getProjects();
  }
);

// for projectRow
provide(KEY_deleteDialog, showDeleteDialog);
provide(KEY_metaDialog, showSearchMetaDialog);
provide(KEY_addNote, addNote);
provide(KEY_attachFile, attachFile);
// for itemRow
provide(KEY_renameNote, renameNote);
provide(KEY_deleteNote, deleteNote);
provide(KEY_renameFromMeta, renameFromMeta);

const bus = inject("bus") as EventBus;

onMounted(() => {
  getProjects();
  bus.on("updateProject", (e: BusEvent) => {
    if (e.source !== "ProjectTree") return;
    let project = e.data;
    let index = projects.value.findIndex((p) => p._id === project._id);
    if (index === -1) return;
    projects.value[index] = project;
  });
});

onBeforeUnmount(() => {
  bus.off("updateProject", (e: BusEvent) => {
    if (e.source !== "ProjectTree") return;
    let project = e.data;
    let index = projects.value.findIndex((p) => p._id === project._id);
    if (index === -1) return;
    projects.value[index] = project;
  });
});

/************************************************
 * Projects (get, add, delete, update, attachFile, renameFromMeta)
 ************************************************/

/**
 * Delete project
 * @param project
 * @param deleteFromDB
 */
function showDeleteDialog(_project: Project, _deleteFromDB: boolean) {
  deleteDialog.value = true;
  project.value = _project; // project to be delted
  deleteFromDB.value = _deleteFromDB;
}

/**
 * Update project by meta
 */
function showSearchMetaDialog() {
  let createProject = false;
  showIdentifierDialog(createProject);
}

async function getProjects() {
  projects.value = [];
  // get projects and their notes
  projects.value = await getProjectsByFolderId(stateStore.selectedFolderId);
  for (let i in projects.value) {
    // notes are the children of project
    projects.value[i].children = await getNotesDB(projects.value[i]._id);
  }
}

/**
 * Open identifier dialog.
 * If createProject is true, the identifier will be used to create a new project
 * otherwise the identifier will be used to update an existing project
 * @param createProject
 */
function showIdentifierDialog(_createProject: boolean) {
  identifierDialog.value = true;
  createProject.value = _createProject;
}

function showImportDialog(_collectionPath: string) {
  importDialog.value = true;
  collectionPath.value = _collectionPath;
}

/**
 * Add an empty project to table
 */
async function addEmptyProject() {
  // udpate db
  let project = (await addProjectDB(stateStore.selectedFolderId)) as Project;
  await createEdge(project);

  // update ui
  projects.value.push(project);
}

/**
 * Add projects by importing files
 * @param filePaths - pdfs paths imported
 */
async function addProjectsByFiles(filePaths: string[]) {
  for (let filePath of filePaths) {
    try {
      // update db
      let project = (await addProjectDB(
        stateStore.selectedFolderId
      )) as Project;
      project.path = (await copyFile(filePath, project._id)) as string;
      project.title = window.path.basename(project.path, ".pdf");
      project = (await updateProjectDB(project)) as Project;

      // get meta
      let buffer = window.fs.readFileSync(filePath);
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
          let isbns = (item as TextItem).str.match(
            /^ISBN.* (?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/
          );
          if (!!isbns) {
            let matched = isbns[0].match(
              /(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+/
            );
            if (matched) identifier = matched[0];
          }
          // match DOI
          let dois = (item as TextItem).str.match(/^http.*doi.*/);
          if (!!dois) identifier = dois[0];

          // update project meta
          if (!!identifier) {
            console.log(identifier);
            let metas = await getMeta(identifier, "json");
            let meta = metas[0];
            project = (await updateProjectByMetaDB(project, meta)) as Project;

            break;
          }
        }
      }

      // create edge
      await createEdge(project);

      // update ui
      projects.value.push(project);
    } catch (_error) {
      error.value = _error as Error;
      errorDialog.value = true;
      // refresh table
      await getProjects();
    }
  }
}

/**
 * Add projects by a collection file (.bib, .ris, etc...)
 * @param isCreateFolder
 */
async function addProjectsByCollection(isCreateFolder: boolean) {
  if (collectionPath.value === "") return;
  // create folder if user wants to
  if (isCreateFolder) {
    console.log(treeview.value);
    if (!treeview.value) return;
    console.log("path", collectionPath.value);
    console.log("createFolder", isCreateFolder);
    let rootNode = treeview.value.getLibraryNode();
    if (!rootNode) return;
    let folderName = window.path.parse(collectionPath.value).name;
    let focus = true;
    console.log("create folder", folderName);
    await treeview.value.addFolder(rootNode, folderName, focus);
  }

  await nextTick(); //wait until ui actions settled

  let metas = await importMeta(collectionPath.value);
  for (let meta of metas) {
    // add a new project to db and update it with meta
    let project = (await addProjectDB(stateStore.selectedFolderId)) as Project;
    project = (await updateProjectByMetaDB(project, meta)) as Project;
    await createEdge(project);

    // update ui
    projects.value.push(project);
  }

  importDialog.value = false;
  collectionPath.value = "";
}

async function processIdentifier(identifier: string) {
  if (!identifier) return;

  try {
    let metas = await getMeta(identifier, "json");
    let meta = metas[0];

    if (createProject.value) {
      // add a new project to db and update it with meta
      let project = (await addProjectDB(
        stateStore.selectedFolderId
      )) as Project;
      console.log("project", project);
      project = (await updateProjectByMetaDB(project, meta)) as Project;
      await createEdge(project);

      // update ui
      projects.value.push(project);
    } else {
      // update an existing project meta
      let project = (await getProjectDB(stateStore.selectedItemId)) as Project;
      project = (await updateProjectByMetaDB(project, meta)) as Project;
      let sourceNode = {
        id: project._id,
        label: project.title,
        type: "project",
      };
      await updateEdge(project._id, { sourceNode: sourceNode } as Edge);

      // update tableview UI
      if (selectedProject.value !== undefined) {
        for (let prop in project) selectedProject.value[prop] = project[prop];
      }
      // update projectree ui
      bus.emit("updateProject", {
        source: componentName,
        data: selectedProject.value,
      });
    }
  } catch (_error) {
    error.value = _error as Error;
    errorDialog.value = true;
    // refresh table
    await getProjects();
  }
}

/**
 * Delete a project from the current folder,
 * if deleteFromDB is true, delete the project from database and remove the actual files
 */
async function deleteProject() {
  if (selectedProject.value === undefined) return;
  // update ui
  projects.value = projects.value.filter(
    (p) => p._id != (selectedProject.value as Project)._id
  );
  // update projectTree ui
  bus.emit("deleteProject", {
    source: componentName,
    data: selectedProject.value._id,
  });

  // update db
  await nextTick(); // wait until the ui closes all windows
  let notes = await getNotesDB(selectedProject.value._id);
  await deleteProjectDB(
    selectedProject.value._id,
    deleteFromDB.value,
    stateStore.selectedFolderId
  );
  if (deleteFromDB.value) {
    await deleteEdge(selectedProject.value._id);
    for (let note of notes) {
      await deleteEdge(note._id);
    }
  }
}

async function attachFile(
  replaceStoredCopy: boolean,
  projectId: string,
  index?: number
) {
  let filePaths = window.fileBrowser.showFilePicker({
    multiSelections: false,
    filters: [{ name: "*.pdf", extensions: ["pdf"] }],
  });
  if (filePaths?.length === 1) {
    // find index
    if (index === undefined)
      index = projects.value.findIndex((p) => p._id === projectId);
    else if (index === -1) index = projects.value.length;

    let dstPath = filePaths[0];
    if (replaceStoredCopy)
      dstPath = (await copyFile(dstPath, projectId)) as string;
    projects.value[index].path = dstPath;
    projects.value[index] = (await updateProjectDB(
      projects.value[index]
    )) as Project;
  }
}

/**
 * Rename PDF file form meta
 * @param row
 * @param index
 */
async function renameFromMeta(project: Project, index?: number) {
  if (project.path === undefined) return;
  let author = "";
  let year = project.year || "Unknown";
  let title = project.title;
  let extname = window.path.extname(project.path);
  if (!project.author || project.author.length === 0) {
    // no author
    author = "Unknown";
  } else {
    // 1 author
    let author0 = project.author[0];
    author = !!author0.family ? author0.family : (author0.literal as string);

    // more than 1 authors
    if (project.author.length > 1) author += " et al.";
  }
  let fileName = `${author} - ${year} - ${title}${extname}`;

  // update backend
  project.path = renameFile(project.path, fileName);
  project = (await updateProjectDB(project)) as Project;

  // update ui
  if (index === undefined)
    index = projects.value.findIndex((p) => p._id === project._id);
  else if (index === -1) index = projects.value.length;
  projects.value[index] = project;
}

/******************************************************
 * Note (add, delete, update)
 *******************************************************/
async function addNote(projectId: string, type: NoteType, index?: number) {
  // update db
  let note = (await addNoteDB(projectId, type)) as Note;
  await createEdge(note);
  await appendEdgeTarget(note.projectId, note);

  // update ui
  if (index === undefined)
    index = projects.value.findIndex((p) => p._id === projectId);
  else if (index === -1) index = projects.value.length;
  // new project does not have children property
  if (!projects.value[index].children)
    projects.value[index].children = [] as Note[];
  projects.value[index].children?.push(note);
  console.log("current project", projects.value[index]);
  stateStore.selectedItemId = note._id;

  // update projectTree ui
  bus.emit("updateProject", {
    source: componentName,
    data: projects.value[index],
  });
}

async function renameNote(note: Note, index?: number) {
  // update db
  note = (await updateNoteDB(note)) as Note;
  let sourceNode = {
    id: note._id,
    label: note.label,
    type: note.dataType,
  };
  await updateEdge(note._id, { sourceNode: sourceNode } as Edge);
  await updateEdgeTarget(note.projectId, note);

  // update ui
  if (index === undefined)
    index = projects.value.findIndex((p) => p._id === note.projectId);
  else if (index === -1) index = projects.value.length;
  let project = projects.value[index];
  if (project.children === undefined) return;
  let noteIndex = project.children.findIndex((n) => n._id === note._id);
  if (noteIndex !== undefined) project.children[noteIndex] = note;

  bus.emit("updateProject", {
    source: componentName,
    data: project,
  }); // to update ui of projectTree
}

async function deleteNote(note: Note, index?: number) {
  // update db
  await deleteNoteDB(note._id);
  await deleteEdge(note._id);
  await deleteEdgeTarget(note.projectId, note._id);

  // update ui
  if (index === undefined)
    index = projects.value.findIndex((p) => p._id === note.projectId);
  else if (index === -1) index = projects.value.length;
  let project = projects.value[index];
  if (project.children === undefined) return;
  project.children = project.children.filter((n) => n._id != note._id);
  console.log("project.children after filter", project.children);

  // update projectTree ui
  bus.emit("updateProject", {
    source: componentName,
    data: project,
  });
}

/************************************************************
 * TableView
 ************************************************************/

/**
 * As a bridge to notify TreeView about the drag event
 * @param key
 */
function onDragProject(key: string) {
  draggingProjectId.value = key;
  if (!!!key && treeview.value) treeview.value.onDragEnd(null);
}

/**********************************************************
 * TreeView
 **********************************************************/

function showExportFolderDialog(_folder: Folder) {
  folder.value = _folder;
  exportFolderDialog.value = true;
}

/**
 * Export a folder as a collection of references
 * @param format - citation.js suported format
 * @param options - extra options
 */
async function exportFolder(
  format: string,
  options: { format?: string; template?: string }
) {
  if (!!!folder.value) return;

  await exportMeta(folder.value, format, options);
}

/**************************************************
 * MetaInfoTab
 **************************************************/

/**
 * Toggle RightMenu and record its size
 * @param visible
 */
function toggleRightMenu(visible: boolean) {
  if (visible) {
    rightMenuSize.value = prvRightMenuSize.value;
  } else {
    // record the rightmenu size for next use
    prvRightMenuSize.value = rightMenuSize.value;
    rightMenuSize.value = 0;
  }
}
</script>
