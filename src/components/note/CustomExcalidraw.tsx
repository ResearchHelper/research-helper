import React, { useState, useEffect } from "react";
import {
  Excalidraw,
  MainMenu,
  serializeAsJSON,
  serializeLibraryAsJSON,
  loadLibraryFromBlob,
} from "@excalidraw/excalidraw";
import "src/css/excalidraw/theme.scss";
import { debounce, uid } from "quasar";
import { useStateStore } from "src/stores/appState";
import { getNote } from "src/backend/project/note";
import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import {
  AppState as ExcalidrawState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
  LibraryItems,
} from "@excalidraw/excalidraw/types/types";
import { Note } from "src/backend/database";

interface InitialData {
  elements: ExcalidrawElement[];
  appState: ExcalidrawState;
  files: BinaryFiles;
  libraryItems: LibraryItems;
}

const fs = window.fs;
const path = window.path;
const stateStore = useStateStore();

export default function CustomExcalidraw(props: { noteId: string }) {
  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const [notePath, setNotePath] = useState<string>("");
  const [ready, setReady] = useState<boolean>(false);

  function loadExcalidraw(): InitialData | undefined {
    if (!notePath) return;
    try {
      // let blob = new Blob([fs.readFileSync(notePath)]);
      // let scene = await loadFromBlob(blob, null, null);
      let scene = JSON.parse(fs.readFileSync(notePath, "utf8"));
      if (!scene.appState.theme)
        scene.appState.theme = stateStore.settings.theme;
      return scene as InitialData;
    } catch (error) {
      console.log(error);
    }
  }

  function _saveExcalidraw(
    elements: ExcalidrawElement[],
    state: ExcalidrawState,
    files: BinaryFiles
  ) {
    if (!notePath) return;
    try {
      let jsonString = serializeAsJSON(elements, state, files, "local");
      let json = JSON.parse(jsonString);
      json.appState.theme = state.theme;
      fs.writeFileSync(notePath, JSON.stringify(json, null, 2));
    } catch (error) {
      console.log(error);
    }
  }

  const saveExcalidraw = debounce(_saveExcalidraw, 100) as (
    elements: ExcalidrawElement[],
    state: ExcalidrawState,
    files: BinaryFiles
  ) => void;

  async function loadExcalidrawLibrary(): Promise<LibraryItems> {
    let items = [] as LibraryItems;
    let storagePath = stateStore.settings.storagePath;
    let folderPath = path.join(storagePath, "excalidrawlibs");
    if (!fs.existsSync(folderPath)) return items;

    let libs = fs.readdirSync(folderPath);
    for (let lib of libs) {
      let filePath = path.join(folderPath, lib);
      let blob = new Blob([fs.readFileSync(filePath)]);
      items = items.concat(await loadLibraryFromBlob(blob));
    }

    return items;
  }

  function saveExcalidrawLibrary(items: LibraryItems) {
    // do not save anything when loading library
    if (!ready) {
      setTimeout(() => {
        setReady(true);
      }, 500);
      return;
    }
    let storagePath = stateStore.settings.storagePath;
    try {
      let folderPath = path.join(storagePath, "excalidrawlibs");
      if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);
      let filePath = path.join(folderPath, uid() + ".excalidrawlib");
      let jsonString = serializeLibraryAsJSON(items);
      fs.writeFileSync(filePath, jsonString);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    getNote(props.noteId).then((note: Note | undefined) => {
      if (!note) return;
      setNotePath(note.path);
    });
  }, [props.noteId]);

  const initialData = loadExcalidraw();
  if (initialData) initialData.libraryItems = loadExcalidrawLibrary();

  return !!notePath ? (
    <Excalidraw
      ref={(api: ExcalidrawImperativeAPI) => {
        setExcalidrawAPI(api);
      }}
      initialData={initialData}
      onChange={saveExcalidraw}
      onLibraryChange={saveExcalidrawLibrary}
    >
      <MainMenu>
        <MainMenu.DefaultItems.LoadScene />
        <MainMenu.DefaultItems.ClearCanvas />
        <MainMenu.DefaultItems.ToggleTheme />
        <MainMenu.DefaultItems.ChangeCanvasBackground />
        <MainMenu.Separator />
        <MainMenu.DefaultItems.Help />
      </MainMenu>
    </Excalidraw>
  ) : null;
}
