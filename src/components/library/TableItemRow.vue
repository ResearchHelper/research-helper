<template>
  <q-tr
    no-hover
    class="cursor-pointer non-selectable"
    @click="clickItem"
    @dblclick="openItem"
  >
    <q-td auto-width></q-td>
    <q-td
      v-if="item.dataType === 'note'"
      colspan="100%"
    >
      <div
        class="row items-center"
        data-cy="content"
      >
        <q-icon
          v-if="item.type === NoteType.EXCALIDRAW"
          style="font-size: 1rem"
          name="bi-easel-fill"
        />
        <q-icon
          v-else
          style="font-size: 1rem"
          name="bi-file-text-fill"
        />
        <input
          v-if="renaming"
          v-model="label"
          @blur="onRenameNote"
          @keydown.enter="($refs.renameInput as HTMLInputElement).blur()"
          ref="renameInput"
        />
        <div
          v-else
          style="font-size: 1rem"
          class="q-ml-xs"
        >
          {{ label }}
        </div>
      </div>
    </q-td>
    <q-td
      v-else
      colspan="100%"
    >
      <div class="row items-center">
        <q-icon
          style="font-size: 1rem; padding-right: 0.3rem"
          name="bi-file-pdf-fill"
        />
        <div
          class="col"
          style="font-size: 1rem"
        >
          {{ label }}
        </div>
      </div>
    </q-td>

    <q-menu
      touch-position
      context-menu
      square
      auto-close
      transition-duration="0"
      data-cy="menu"
    >
      <q-list
        v-if="item.dataType === 'note'"
        dense
      >
        <q-item
          clickable
          @click="copyID"
        >
          <q-item-section>{{ $t("copy-note-id") }}</q-item-section>
        </q-item>

        <q-separator />

        <q-item
          clickable
          @click="openItem"
          data-cy="btn-open-item"
        >
          <q-item-section>{{ $t("open-note") }}</q-item-section>
        </q-item>
        <q-item
          clickable
          @click="setRenaming"
        >
          <q-item-section>{{ $t("rename-note") }}</q-item-section>
        </q-item>
        <q-item
          clickable
          @click="deleteItem"
        >
          <q-item-section>{{ $t("delete-note") }}</q-item-section>
        </q-item>
      </q-list>

      <q-list
        v-else
        dense
      >
        <q-item
          clickable
          @click="openItem"
        >
          <q-item-section>{{ $t("open-pdf") }}</q-item-section>
        </q-item>

        <q-item
          clickable
          @click="renameFile"
        >
          <q-item-section>{{ $t("rename-pdf-from-metadata") }}</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-tr>
</template>
<script setup lang="ts">
// types
import { computed, inject, PropType, ref } from "vue";
import { Project, Note, NoteType } from "src/backend/database";
import {
  KEY_deleteNote,
  KEY_renameFromMeta,
  KEY_renameNote,
} from "./injectKeys";
// db
import { useStateStore } from "src/stores/appState";
import { copyToClipboard } from "quasar";

const props = defineProps({
  item: { type: Object as PropType<Project | Note>, required: true },
});
const stateStore = useStateStore();

const newLabel = ref("");
const renaming = ref(false);
const renameInput = ref<HTMLInputElement | null>(null);

// label has to be reactive
// once props.item.path is changed
// we also need to change the label
const label = computed({
  get() {
    let _label = "";
    if (props.item.dataType === "note") {
      _label = props.item.label;
    } else if (props.item.dataType === "project") {
      _label = window.path.basename(props.item.path as string);
    }
    return _label;
  },
  set(_newLabel: string) {
    newLabel.value = _newLabel;
  },
});

const renameNote = inject(KEY_renameNote) as (
  note: Note,
  index?: number
) => void;
const deleteNote = inject(KEY_deleteNote) as (
  note: Note,
  index?: number
) => void;
const renameFromMeta = inject(KEY_renameFromMeta) as (
  project: Project,
  index?: number
) => void;

function copyID() {
  copyToClipboard(props.item._id);
}

function clickItem() {
  stateStore.selectedItemId = props.item._id;
}

function openItem() {
  let pageId = props.item._id;
  let pageLabel = props.item.label;
  let pageType = "";
  if (props.item.dataType === "project") {
    if (props.item.path) pageType = "ReaderPage";
  } else if ((props.item as Project | Note).dataType === "note") {
    if (props.item.type === NoteType.EXCALIDRAW) pageType = "ExcalidrawPage";
    else pageType = "NotePage";
  }
  stateStore.openPage({ pageId, pageType, pageLabel });
}

function setRenaming() {
  renaming.value = true;

  setTimeout(() => {
    let input = renameInput.value as HTMLInputElement;
    input.focus();
    input.select();
  }, 100);
}

function onRenameNote() {
  let note = props.item as Note;
  note.label = newLabel.value;
  renameNote(note);

  renaming.value = false;
}

async function deleteItem() {
  deleteNote(props.item as Note);
}

async function renameFile() {
  renameFromMeta(props.item as Project);
}
</script>
