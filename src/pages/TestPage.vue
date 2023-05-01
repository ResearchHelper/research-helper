<template>
  <!-- @change trigge with onChange in React component -->
  <ExcalidrawReact
    :initialData="initialData"
    @change="saveScene"
  />
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";
// types
import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import { AppState, BinaryFiles } from "@excalidraw/excalidraw/types/types";
import { Note } from "src/backend/database";
// veaury and excalidraw
import { applyPureReactInVue } from "veaury";
import CustomExcalidraw from "src/components/note/CustomExcalidraw.jsx";
import {
  serializeAsJSON,
  serializeLibraryAsJSON,
} from "@excalidraw/excalidraw";
// utils
import { debounce } from "quasar";
import { getNote } from "src/backend/project/note";

const ExcalidrawReact = applyPureReactInVue(CustomExcalidraw);

// props and refs
const props = defineProps({
  visible: Boolean,
  itemId: { type: String, required: true },
});
const fs = window.fs;
const notePath = ref("");
const initialData = ref(null);

// TODO when opening the note by usual way, the noteId is passd in
// const note = (await getNote(props.itemId)) as Note;
// notePath.value = note.path;
notePath.value = "src/components/note/test.json";
initialData.value = loadScene();

// TODO: save (load) excalidraw library data

function loadScene() {
  try {
    let data = JSON.parse(fs.readFileSync(notePath.value, "utf8"));
    console.log(data);
    return data;
  } catch (error) {
    return {};
  }
}
function _saveScene(
  elements: ExcalidrawElement[],
  state: AppState,
  files: BinaryFiles
) {
  try {
    console.log("saved");
    const json = serializeAsJSON(elements, state, files, "local");
    fs.writeFileSync(notePath.value, json);
  } catch (error) {
    console.log(error);
  }
}
const saveScene = debounce(_saveScene, 100) as (
  elements: ExcalidrawElement[],
  state: AppState,
  files: BinaryFiles
) => void;
</script>
