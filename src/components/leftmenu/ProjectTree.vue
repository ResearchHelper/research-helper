<template>
  <q-tree
    ref="tree"
    dense
    no-transition
    no-selection-unset
    no-nodes-label="No working projects"
    :nodes="projectStore.openedProjects"
    node-key="_id"
    selected-color="primary"
    v-model:selected="stateStore.currentPageId"
    v-model:expanded="expanded"
  >
    <template v-slot:default-header="prop">
      <!-- use full-width so that click trailing empty space
        of the node still fires click event -->
      <!-- only note can drop into a project -->
      <div
        style="width: calc(100% - 23px)"
        class="row"
        @click="selectItem(prop.node)"
      >
        <q-menu
          square
          touch-position
          context-menu
          @before-show="menuSwitch(prop.node)"
        >
          <!-- menu for project -->
          <q-list
            dense
            v-if="showProjectMenu"
          >
            <q-item
              clickable
              v-close-popup
              @click="addNote(prop.node, NoteType.MARKDOWN)"
            >
              <q-item-section>
                {{ $t("add-markdown-note") }}
              </q-item-section>
            </q-item>
            <q-item
              clickable
              v-close-popup
              @click="addNote(prop.node, NoteType.EXCALIDRAW)"
            >
              <q-item-section>
                {{ $t("add-excalidraw") }}
              </q-item-section>
            </q-item>
            <q-separator />
            <q-item
              clickable
              v-close-popup
              @click="showInExplorer(prop.node)"
            >
              <q-item-section>{{ $t("show-in-explorer") }}</q-item-section>
            </q-item>
            <q-item
              clickable
              v-close-popup
              @click="closeProject(prop.key)"
            >
              <q-item-section>
                {{ $t("close-project") }}
              </q-item-section>
            </q-item>
          </q-list>

          <!-- menu for notes -->
          <q-list
            dense
            v-else
          >
            <q-item
              clickable
              v-close-popup
              @click="showInExplorer(prop.node)"
            >
              <q-item-section>{{ $t("show-in-explorer") }}</q-item-section>
            </q-item>
            <q-item
              clickable
              v-close-popup
              @click="setRenameNote(prop.node._id)"
            >
              <q-item-section> {{ $t("rename") }} </q-item-section>
            </q-item>
            <q-item
              clickable
              v-close-popup
              @click="deleteNote(prop.node)"
            >
              <q-item-section> {{ $t("delete") }} </q-item-section>
            </q-item>
          </q-list>
        </q-menu>

        <q-icon
          v-if="prop.node.dataType === 'project'"
          size="1.2rem"
          name="import_contacts"
        />
        <q-icon
          v-else-if="
            prop.node.dataType === 'note' &&
            prop.node.type === NoteType.EXCALIDRAW
          "
          size="1.2rem"
          name="bi-easel"
        />
        <!-- markdown note -->
        <q-icon
          v-else
          size="1.2rem"
          name="bi-file-earmark-text"
        />
        <!-- note icon has 1rem width -->
        <!-- input must have keypress.space.stop since space is default to expand row rather than space in text -->
        <input
          v-if="prop.node._id == renamingNoteId"
          style="width: calc(100% - 1.2rem)"
          v-model="prop.node.label"
          @keydown.enter="renameNote"
          @blur="renameNote"
          @keypress.space.stop
          ref="renameInput"
        />
        <!-- add item-id and type for access of drag source -->
        <div
          v-else
          style="width: calc(100% - 1.2rem); font-size: 1rem"
          class="ellipsis non-selectable"
          :item-id="prop.key"
          :type="prop.node.dataType"
        >
          {{ prop.node.label }}
          <q-tooltip> ID: {{ prop.key }} </q-tooltip>
        </div>
      </div>
      <q-icon
        v-if="prop.node.dataType == 'project'"
        name="close"
        @click="closeProject(prop.key)"
      >
        <q-tooltip> {{ $t("close-project") }} </q-tooltip>
      </q-icon>
    </template>
  </q-tree>
</template>
<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from "vue";
import { QTree } from "quasar";
import { Note, NoteType, Page, Project } from "src/backend/database";
// db
import { useStateStore } from "src/stores/appState";
import { useProjectStore } from "src/stores/projectStore";
import { getProject } from "src/backend/project/project";

const stateStore = useStateStore();
const projectStore = useProjectStore();

const tree = ref<QTree | null>(null);
const renameInput = ref<HTMLInputElement | null>(null);
// const renamingNote = ref<QTreeNode | null>(null);
const renamingNoteId = ref("");
const addingNote = ref(false);
const expanded = ref<string[]>([]);
const showProjectMenu = ref(true);

onMounted(async () => {
  console.log("openedProjects", projectStore.openedProjects);
  // expand all projects
  expanded.value = Array.from(projectStore.openedProjects.map((p) => p._id));

  // select the item associated with current window
  let selected = stateStore.currentPageId;
  if (!tree.value) return;
  let selectedNode = tree.value.getNodeByKey(selected);
  if (!!selectedNode && selectedNode?.children?.length > 0)
    expanded.value.push(selected);
});

watch(
  () => stateStore.openedPage,
  async (page: Page) => {
    if (page.type.indexOf("Plugin") > -1) return;
    if (!!!page.id || !tree.value) return;
    let node = tree.value.getNodeByKey(page.id);
    if (!!node) return; // if project is active already, return

    let item = (await getProject(page.id)) as Project | Note;
    if (item?.dataType == "project") {
      await projectStore.openProject(page.id);
      expanded.value.push(page.id);
    } else if (item?.dataType == "note") {
      // some notes are independent of project, like memo
      if (!item.projectId) return;
      await projectStore.openProject(item.projectId);
    }
  },
  { deep: true }
);

function menuSwitch(node: Project | Note) {
  if (node.dataType == "note") {
    // show context menu for notes
    showProjectMenu.value = false;
  } else {
    // show context menu for project
    showProjectMenu.value = true;
  }
}

function selectItem(node: Project | Note) {
  console.log(node);
  stateStore.currentPageId = node._id;
  if (node.dataType === "project" && (node.children?.length as number) > 0)
    expanded.value.push(node._id);

  // open item
  let id = node._id;
  let type = "";
  let label = node.label;
  if (node.dataType === "project") type = "ReaderPage";
  else if ((node as Project | Note).dataType === "note") {
    if (node.type === NoteType.EXCALIDRAW) type = "ExcalidrawPage";
    else type = "NotePage";
  }
  stateStore.openPage({ id, type, label });
}

function showInExplorer(node: Project | Note) {
  let path = "";
  if (node.path) {
    path = node.path;
  } else {
    window.path.join(stateStore.settings.storagePath, node._id);
  }
  // don't use props.row.path because it might not exists
  // let path = window.path.join(stateStore.settings.storagePath, props.row._id);
  window.fileBrowser.showFileInFolder(path);
}

async function closeProject(projectId: string) {
  // close all pages
  let project = projectStore.openedProjects.find((p) => p._id === projectId);
  if (project) {
    stateStore.closePage(project._id);
    for (let note of project.children as Note[]) {
      await nextTick(); // do it slowly one by one
      stateStore.closePage(note._id);
    }
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

async function addNote(project: Project, type: NoteType) {
  let note = projectStore.createNote(project._id, type);
  await projectStore.addNote(note);
  expanded.value.push(project._id);
  addingNote.value = true;
  // rename note
  await nextTick(); // wait until ui updates
  setRenameNote(note._id);
}

async function deleteNote(note: Note) {
  stateStore.closePage(note._id);
  await projectStore.deleteNote(note._id);
  // select something else if the selectedItem is deleted
  if (note._id === projectStore.selected[0]._id) {
    let project = projectStore.openedProjects.find(
      (p) => p._id === note.projectId
    );

    if (project && project.children) {
      if (project.children.length == 0) {
        selectItem(project);
      } else {
        selectItem(project.children[0]);
      }
    }
  }
}

function setRenameNote(noteId: string) {
  // set renaming note and show input
  renamingNoteId.value = noteId;

  setTimeout(() => {
    // wait till input appears
    // focus onto the input and select the text
    let input = renameInput.value;
    if (!input) return;
    input.focus();
    input.select();
  }, 100);
}

async function renameNote() {
  let note = tree.value?.getNodeByKey(renamingNoteId.value) as Note;
  if (!!!note) return;
  projectStore.updateNote(note._id, note);

  if (addingNote.value) selectItem(note); // open the note
  addingNote.value = false;
  renamingNoteId.value = "";
}
</script>
