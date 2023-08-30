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
    :projects="deleteProjects"
    :deleteFromDB="deleteFromDB"
    @confirm="deleteProject"
  />

  <q-splitter
    style="position: absolute; width: 100%; height: 100%"
    :limits="[10, 30]"
    separator-class="q-splitter-separator"
    v-model="treeViewSize"
  >
    <template v-slot:before>
      <FolderTree
        style="background: var(--color-library-treeview-bkgd)"
        @exportFolder="(folder: Folder) => showExportFolderDialog(folder)"
        ref="treeview"
      />
    </template>
    <template v-slot:after>
      <q-splitter
        style="overflow: hidden"
        reverse
        :limits="[0, 60]"
        :separator-class="{
          'q-splitter-separator': stateStore.showLibraryRightMenu,
        }"
        :disable="!stateStore.showLibraryRightMenu"
        v-model="rightMenuSize"
        emit-immediately
        @update:model-value="(size: number) => resizeRightMenu(size)"
      >
        <template v-slot:before>
          <ActionBar
            style="
              min-height: 36px;
              background: var(--color-library-toolbar-bkgd);
            "
            v-model:searchString="searchString"
            @addEmptyProject="addEmptyProject"
            @addByFiles="(filePaths) => addProjectsByFiles(filePaths)"
            @addByCollection="
              (collectionPath) => showImportDialog(collectionPath)
            "
            @showIdentifierDialog="showIdentifierDialog(true)"
            ref="actionBar"
          />
          <!-- actionbar height 36px, table view is 100%-36px -->
          <ProjectTable
            v-model:projects="projectStore.projects"
            :searchString="searchString"
            style="
              height: calc(100% - 36px);
              width: 100%;
              background: var(--color-library-tableview-bkgd);
            "
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
                v-if="!!rightMenuSize"
                :project="(projectStore.selected[0] as Project)"
              />
            </q-tab-panel>
          </q-tab-panels>
        </template>
      </q-splitter>
    </template>
  </q-splitter>
</template>

<script setup lang="ts">
import { ref, watch, provide, onMounted, inject, nextTick } from "vue";
// types
import { Folder, Meta, Note, Project } from "src/backend/database";
import { KEY_metaDialog, KEY_deleteDialog } from "./injectKeys";
import { TextItem } from "pdfjs-dist/types/src/display/api";
// components
import ActionBar from "src/components/library/ActionBar.vue";
import ProjectTable from "src/components/library/ProjectTable.vue";
import FolderTree from "src/components/library/FolderTree.vue";
import MetaInfoTab from "src/components/MetaInfoTab.vue";
import ExportDialog from "src/components/library/ExportDialog.vue";
import IdentifierDialog from "src/components/library/IdentifierDialog.vue";
import DeleteDialog from "src/components/library/DeleteDialog.vue";
import ImportDialog from "src/components/library/ImportDialog.vue";
// db
import { useStateStore } from "src/stores/appState";
import { useProjectStore } from "src/stores/projectStore";
import {
  getMeta,
  exportMeta,
  importMeta,
  generateCiteKey,
} from "src/backend/project/meta";
import { copyFile } from "src/backend/project/file";
// util (to scan identifier in PDF)
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "node_modules/pdfjs-dist/build/pdf.worker.min.js";

const stateStore = useStateStore();
const projectStore = useProjectStore();

/*********************************
 * Data
 *********************************/
// component refs
const treeview = ref<typeof FolderTree | null>(null);

// data
const searchString = ref("");

const treeViewSize = ref(20);
const rightMenuSize = ref(0);

const exportFolderDialog = ref(false);
const folder = ref<Folder | null>(null);

const deleteDialog = ref(false);
const deleteProjects = ref<Project[]>([]);
const deleteFromDB = ref(false);

const identifierDialog = ref(false);
const createProject = ref(false);

const importDialog = ref(false);
const collectionPath = ref<string>("");

watch(
  () => stateStore.selectedFolderId,
  async (folderId: string) => {
    projectStore.selected = [];
    projectStore.loadProjects(folderId);
  }
);

// onLayouChanged, appstate and layout will be saved
const onLayoutChanged = inject("onLayoutChanged") as () => void;
watch(
  [
    () => stateStore.showLibraryRightMenu,
    () => stateStore.libraryRightMenuSize,
  ],
  onLayoutChanged
);

// for projectRow
provide(KEY_deleteDialog, showDeleteDialog);
provide(KEY_metaDialog, showSearchMetaDialog);

onMounted(async () => {
  // fetch the newest version of project from database
  // and also update the selected projects
  await projectStore.loadProjects(stateStore.selectedFolderId);
  let selectedIds = projectStore.selected.map((project) => project._id);
  projectStore.selected = [];
  for (let selectedId of selectedIds) {
    let project = projectStore.getProject(selectedId);
    if (project) projectStore.selected.push(project);
  }

  // rightmenu
  if (stateStore.showLibraryRightMenu)
    rightMenuSize.value = stateStore.libraryRightMenuSize;
});

/************************************************
 * Projects (get, add, delete, update, attachFile, renameFromMeta)
 ************************************************/
/**
 * Delete project
 * @param project
 * @param deleteFromDB
 */
function showDeleteDialog(_deleteProjects: Project[], _deleteFromDB: boolean) {
  deleteDialog.value = true;
  deleteProjects.value = _deleteProjects; // project to be delted
  deleteFromDB.value = _deleteFromDB;
}

/**
 * Update project by meta
 */
function showSearchMetaDialog() {
  let createProject = false;
  showIdentifierDialog(createProject);
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
  // udpate db and ui
  let project = projectStore.createProject(stateStore.selectedFolderId);
  projectStore.addProject(project, true);
}

/**
 * Add projects by importing files
 * @param filePaths - pdfs paths imported
 */
async function addProjectsByFiles(filePaths: string[]) {
  for (let filePath of filePaths) {
    try {
      let project = projectStore.createProject(stateStore.selectedFolderId);
      projectStore.addProject(project, true);
      let path = (await copyFile(filePath, project._id)) as string;
      let title = window.path.basename(path, ".pdf");
      let props = {
        path: path,
        title: title,
        label: title,
      };
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
            let metas = (await getMeta(identifier, "json")) as Meta[];
            let meta = metas[0];
            meta["citation-key"] = generateCiteKey(
              meta,
              stateStore.settings.citeKeyRule
            );
            Object.assign(props, meta);
            break;
          }
        }
      }

      await projectStore.updateProject(project._id, props as Project);
    } catch (error) {
      console.log(error);
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
    if (!treeview.value) return;
    let rootNode = treeview.value.getLibraryNode();
    if (!rootNode) return;
    let folderName = window.path.parse(collectionPath.value).name;
    let focus = true;
    await treeview.value.addFolder(rootNode, folderName, focus);
  }

  await nextTick(); //wait until ui actions settled

  let metas = await importMeta(collectionPath.value);
  for (let meta of metas) {
    // add a new project to db and update it with meta
    let project = projectStore.createProject(stateStore.selectedFolderId);
    await projectStore.addProject(project, true);
    await projectStore.updateProject(project._id, meta as Project);
  }

  importDialog.value = false;
  collectionPath.value = "";
}

async function processIdentifier(identifier: string) {
  if (!identifier) return;

  let metas = (await getMeta(identifier, "json")) as Meta[];
  let meta = metas[0];

  if (createProject.value) {
    // add a new project to db and update it with meta
    let project = projectStore.createProject(stateStore.selectedFolderId);
    await projectStore.addProject(project, true);
    await projectStore.updateProject(project._id, meta as Project);
  } else {
    // update existing project
    await projectStore.updateProject(
      projectStore.selected[0]._id,
      meta as Project
    );
  }
}

/**
 * Delete a project from the current folder,
 * if deleteFromDB is true, delete the project from database and remove the actual files
 */
async function deleteProject() {
  // delete projects
  let deleteIds = projectStore.selected.map((p) => p._id);

  for (let projectId of deleteIds) {
    let project = projectStore.openedProjects.find((p) => p._id === projectId);
    if (project) {
      for (let note of project.children as Note[]) {
        stateStore.closePage(projectId);
        await nextTick(); // do it slowly one by one
        stateStore.closePage(note._id);
      }

      // remove project from openedProjects
      projectStore.openedProjects = projectStore.openedProjects.filter(
        (p) => p._id !== projectId
      );

      // if no page left, open library page
      setTimeout(() => {
        if (projectStore.openedProjects.length === 0)
          stateStore.currentPageId = "library";
      }, 50);
    }
    // delete from db
    projectStore.deleteProject(
      projectId,
      deleteFromDB.value,
      stateStore.selectedFolderId
    );
  }
}

/**********************************************************
 * FolderTree
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
watch(
  () => stateStore.showLibraryRightMenu,
  (visible: boolean) => {
    if (visible) {
      // if visible, the left menu has at least 10 unit width
      rightMenuSize.value = Math.max(stateStore.libraryRightMenuSize, 15);
    } else {
      // if not visible, record the size and close the menu
      stateStore.libraryRightMenuSize = rightMenuSize.value;
      rightMenuSize.value = 0;
    }
  }
);

function resizeRightMenu(size: number) {
  if (size < 8) {
    rightMenuSize.value = 0;
    stateStore.showLibraryRightMenu = false;
  }
  stateStore.libraryRightMenuSize = size > 10 ? size : 30;
}
</script>
