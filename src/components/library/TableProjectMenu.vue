<template>
  <q-menu
    touch-position
    context-menu
    square
    transition-duration="0"
  >
    <q-list dense>
      <q-item
        v-if="stateStore.selected.length <= 1"
        clickable
        v-close-popup
        @click="copyProjectId"
      >
        <q-item-section>{{ $t("copy-project-id") }}</q-item-section>
      </q-item>
      <q-item
        clickable
        v-close-popup
        @click="showInExplorer"
      >
        <q-item-section>{{ $t("show-in-explorer") }}</q-item-section>
      </q-item>

      <q-separator v-if="stateStore.selected.length == 1" />

      <q-item
        v-if="stateStore.selected.length == 1"
        clickable
        v-close-popup
        @click="addNote(NoteType.MARKDOWN)"
      >
        <q-item-section> {{ $t("add-markdown-note") }} </q-item-section>
      </q-item>
      <q-item
        v-if="stateStore.selected.length == 1"
        clickable
        v-close-popup
        @click="addNote(NoteType.EXCALIDRAW)"
      >
        <q-item-section> {{ $t("add-excalidraw") }} </q-item-section>
      </q-item>
      <q-item
        v-if="stateStore.selected.length == 1"
        clickable
        @mouseover="($refs.submenu as QMenu).show()"
      >
        <q-item-section>
          {{
            !!stateStore.selected[0].path
              ? $t("replace-file")
              : $t("attach-file")
          }}
        </q-item-section>
        <q-item-section side>
          <q-icon name="arrow_right" />
        </q-item-section>
        <q-menu
          square
          anchor="top end"
          self="top start"
          ref="submenu"
        >
          <q-list dense>
            <q-item
              clickable
              v-close-popup
            >
              <q-item-section @click="onAttachFile(true)">
                {{
                  !!stateStore.selected[0].path
                    ? $t("replace-stored-copy-of-file")
                    : $t("attach-stored-copy-of-file")
                }}
              </q-item-section>
            </q-item>
            <q-item
              clickable
              v-close-popup
            >
              <q-item-section @click="onAttachFile(false)">
                {{
                  !!stateStore.selected[0].path
                    ? $t("replace-path-to-file")
                    : $t("attach-path-to-file")
                }}
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-item>

      <q-separator />
      <q-item
        clickable
        v-close-popup
        @click="openProject"
      >
        <q-item-section>{{ $t("open-project") }}</q-item-section>
      </q-item>

      <q-item
        v-if="stateStore.selected.length == 1"
        clickable
        v-close-popup
        @click="searchMeta"
      >
        <q-item-section>{{ $t("search-meta-info") }}</q-item-section>
      </q-item>

      <q-item
        v-if="stateStore.selectedFolderId != 'library'"
        clickable
        v-close-popup
        @click="deleteProject(false)"
      >
        <q-item-section>{{ $t("delete-from-folder") }}</q-item-section>
      </q-item>
      <q-item
        clickable
        v-close-popup
        @click="deleteProject(true)"
      >
        <q-item-section>{{ $t("delete-from-database") }}</q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>
<script setup lang="ts">
// types
import { inject, nextTick } from "vue";
import { NoteType, Project } from "src/backend/database";
import { QMenu } from "quasar";
import { KEY_metaDialog, KEY_deleteDialog } from "./injectKeys";
// db
import { copyToClipboard } from "quasar";
import { useStateStore } from "src/stores/appState";
import { useProjectStore } from "src/stores/projectStore";
const stateStore = useStateStore();
const projectStore = useProjectStore();

const emit = defineEmits(["expandRow"]);

// dialogs
const showSearchMetaDialog = inject(KEY_metaDialog) as () => void;
const showDeleteDialog = inject(KEY_deleteDialog) as (
  deleteProjects: Project[],
  deleteFromDB: boolean
) => void;

function expandRow(isExpand: boolean) {
  emit("expandRow", isExpand);
}

async function addNote(type: NoteType) {
  let project = stateStore.selected[0];
  let note = projectStore.createNote(project._id, type);
  await projectStore.addNote(note);
  expandRow(true);
}

async function openProject() {
  for (let project of stateStore.selected) {
    let id = project._id;
    let label = project.label;
    let type = "ReaderPage";
    stateStore.openPage({ id, type, label });
    await nextTick();
  }
}

function copyProjectId() {
  copyToClipboard(stateStore.selected[0]._id);
}

function showInExplorer() {
  // don't use project.path because it might not exists
  for (let project of stateStore.selected) {
    let path = window.path.join(stateStore.settings.storagePath, project._id);
    window.fileBrowser.showFileInFolder(path);
  }
}

function deleteProject(deleteFromDB: boolean) {
  showDeleteDialog(stateStore.selected, deleteFromDB);
}

/**
 * Update a project by meta
 */
function searchMeta() {
  showSearchMetaDialog();
}

/**
 * Attach PDF to a project
 * @param replaceStoredCopy - replace the copy in storage?
 */
async function onAttachFile(replaceStoredCopy: boolean) {
  await projectStore.attachPDF(stateStore.selected[0]._id, replaceStoredCopy);
  expandRow(true);
}
</script>
