<template>
  <q-tree
    ref="tree"
    dense
    no-transition
    no-selection-unset
    no-nodes-label="No working projects"
    :nodes="projects"
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
              @click="setRenameNote(prop.node)"
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
          v-if="prop.node == renamingNote"
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
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { EventBus, QTree, QTreeNode } from "quasar";
import {
  BusEvent,
  Edge,
  Note,
  NoteType,
  Page,
  Project,
} from "src/backend/database";
// db
import { useStateStore } from "src/stores/appState";
import {
  getNotes as getNotesDB,
  addNote as addNoteDB,
  deleteNote as deleteNoteDB,
  updateNote as updateNoteDB,
  getNotes,
} from "src/backend/project/note";
import { sortTree } from "src/backend/project/utils";
import { getProject } from "src/backend/project/project";
import {
  createEdge,
  deleteEdge,
  updateEdge,
  appendEdgeTarget,
  deleteEdgeTarget,
  updateEdgeTarget,
} from "src/backend/project/graph";

const componentName = "ProjectTree";

const stateStore = useStateStore();
const bus = inject("bus") as EventBus;

const tree = ref<QTree | null>(null);
const renameInput = ref<HTMLInputElement | null>(null);
const renamingNote = ref<QTreeNode | null>(null);
const addingNote = ref(false);
const projects = ref<Project[]>([]);
const expanded = ref<string[]>([]);
const showProjectMenu = ref(true);

onMounted(async () => {
  // events emited from other components (TableView.vue)
  bus.on("updateProject", (e: BusEvent) => updateProject(e));
  bus.on("deleteProject", (e: BusEvent) => closeProject(e.data));

  await getProjectTree();
  let selected = stateStore.currentPageId;
  if (!tree.value) return;
  let selectedNode = tree.value.getNodeByKey(selected);
  if (!!selectedNode && selectedNode?.children?.length > 0)
    expanded.value.push(selected);
});

onBeforeUnmount(() => {
  // not necessary for this component, but a good habit
  bus.off("updateProject", (e: BusEvent) => updateProject(e));
  bus.off("deleteProject", (e: BusEvent) => closeProject(e.data));
});

watch(
  () => stateStore.openedPage,
  async (page: Page) => {
    if (page.type.indexOf("Plugin") > -1) return;
    let id = page.id;
    if (!!!id || !tree.value) return;
    let node = tree.value.getNodeByKey(id);
    if (!!node) return; // if project is active already, return

    let item = (await getProject(id)) as Project | Note;
    if (item?.dataType == "project") {
      stateStore.openedProjectIds.add(id);
      pushProjectNode(id);
    } else if (item?.dataType == "note") {
      // some notes are independent of project, like memo
      if (!item.projectId) return;
      stateStore.openedProjectIds.add(item.projectId);
      pushProjectNode(item.projectId);
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

async function getProjectTree() {
  projects.value = [] as Project[];
  for (let projectId of stateStore.openedProjectIds) {
    await pushProjectNode(projectId);
  }

  // sort notes in each project
  for (let i in projects.value) {
    sortTree(projects.value[i]);
  }
}

async function pushProjectNode(projectId: string) {
  let project = await getProject(projectId);
  if (project === undefined) return;
  let notes = await getNotesDB(projectId);
  project.children = notes;
  projects.value.push(project);
  expanded.value.push(projectId);
}

/**
 * Receive updated project from other component and update the projectTree
 * @param project
 */
function updateProject(event: BusEvent) {
  let source = event.source;
  let project = event.data;
  if (!project) return;
  let idx = projects.value.findIndex((p) => p._id == project._id);
  if (idx === -1) return;

  // when updating project, be careful whether children property is undefined
  // the updateProject event emit from PDFReader has empty children property
  let children = projects.value[idx].children;
  if (source === "ProjectBrowser") children = project.children;
  project.children = children;
  projects.value[idx] = project;
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

async function closeProject(projectId: string) {
  stateStore.closePage(projectId);
  let notes = await getNotes(projectId);
  for (let note of notes) {
    await nextTick(); // do it slowly one by one
    stateStore.closePage(note._id);
  }

  let selected = stateStore.currentPageId;
  if (stateStore.currentPageId == projectId) {
    selected = stateStore.openedProjectIds.has(projectId)
      ? projectId
      : "library";
  }
  stateStore.openedProjectIds.delete(projectId);
  projects.value = projects.value.filter((p) => p._id != projectId);

  setTimeout(() => {
    stateStore.currentPageId = selected;
  }, 50);
}

async function addNote(node: Project, type: NoteType) {
  // update db
  let note = (await addNoteDB(node._id, type)) as Note;
  await createEdge(note);
  await appendEdgeTarget(note.projectId, note);

  // update ui
  node.children?.push(note);
  addingNote.value = true;
  await nextTick(); // wait until ui updates
  setRenameNote(note);
}

async function deleteNote(node: Note) {
  // update db
  await deleteNoteDB(node._id);
  await deleteEdge(node._id); // delete edge of note
  await deleteEdgeTarget(node.projectId, node._id); // delete target from project's edge

  // update ui
  let index = projects.value.findIndex(
    (p) => (p.children as Note[]).indexOf(node) > -1
  );
  let project = projects.value[index];

  project.children = (project.children as Note[]).filter(
    (child) => child._id != node._id
  );
  if (project.children.length == 0) {
    selectItem(project);
  } else {
    selectItem(project.children[0]);
  }
}

function setRenameNote(node: Note) {
  // set renaming note and show input
  renamingNote.value = node;

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
  let note = renamingNote.value as Note;
  if (!!!note) return;
  // update db
  await updateNoteDB(note);
  let sourceNode = {
    id: note._id,
    label: note.label,
    type: note.dataType,
  };
  await updateEdge(note._id, { sourceNode: sourceNode } as Edge);
  await updateEdgeTarget(note.projectId, note);

  // update ui
  let project = projects.value.find((p) => p._id === note.projectId);
  sortTree(project as any);
  await nextTick();
  bus.emit("updateProject", {
    source: componentName,
    data: project,
  });

  if (addingNote.value) selectItem(note); // open the note
  addingNote.value = false;
  renamingNote.value = null;
}
</script>
