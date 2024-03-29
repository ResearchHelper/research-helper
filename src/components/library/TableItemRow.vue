<template>
  <q-tr
    no-hover
    class="cursor-pointer non-selectable"
    @click="clickItem"
    @dblclick="openItem"
  >
    <q-td auto-width></q-td>
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
        <q-item
          clickable
          @click="showInExplorer"
        >
          <q-item-section>{{ $t("show-in-explorer") }}</q-item-section>
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
          @click="showInExplorer"
        >
          <q-item-section>{{ $t("show-in-explorer") }}</q-item-section>
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
import { computed, PropType, ref } from "vue";
import { Project, Note, NoteType } from "src/backend/database";
// db
import { useStateStore } from "src/stores/appState";
import { useProjectStore } from "src/stores/projectStore";
import { copyToClipboard } from "quasar";

const props = defineProps({
  item: { type: Object as PropType<Project | Note>, required: true },
});
const stateStore = useStateStore();
const projectStore = useProjectStore();

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

function copyID() {
  copyToClipboard(props.item._id);
}

function showInExplorer() {
  // don't use props.row.path because it might not exists
  window.fileBrowser.showFileInFolder(props.item.path as string);
}

function clickItem() {
  projectStore.selected = [props.item];
}

function openItem() {
  let id = props.item._id;
  let label = props.item.label;
  let type = "";
  if (props.item.dataType === "project") {
    if (props.item.path) type = "ReaderPage";
  } else if ((props.item as Project | Note).dataType === "note") {
    if (props.item.type === NoteType.EXCALIDRAW) type = "ExcalidrawPage";
    else type = "NotePage";
  }
  stateStore.openPage({ id, type, label });
}

function setRenaming() {
  renaming.value = true;

  setTimeout(() => {
    let input = renameInput.value as HTMLInputElement;
    input.focus();
    input.select();
  }, 100);
}

async function onRenameNote() {
  // let note = props.item as Note;
  // note.label = newLabel.value;
  await projectStore.updateNote(props.item._id, {
    label: newLabel.value,
  } as Note);
  renaming.value = false;
}

async function deleteItem() {
  await projectStore.deleteNote(props.item._id);
}

function renameFile() {
  projectStore.renamePDF(props.item._id);
}
</script>
