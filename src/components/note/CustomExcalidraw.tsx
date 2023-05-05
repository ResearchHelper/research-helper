import React, { useState, useEffect } from "react";
import {
  Excalidraw,
  MainMenu,
  serializeAsJSON,
  serializeLibraryAsJSON,
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

export default function CustomExcalidraw(props: {
  visible: boolean;
  noteId: string;
}) {
  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const [notePath, setNotePath] = useState<string>("");
  const [ready, setReady] = useState<boolean>(false);

  function loadExcalidraw(): InitialData | undefined {
    if (!notePath) return;
    try {
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
    if (!notePath && !ready) return;
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

  function loadExcalidrawLibrary(): LibraryItems {
    let storagePath = stateStore.settings.storagePath;
    let filePath = path.join(storagePath, "library.excalidrawlib");
    if (!fs.existsSync(filePath)) return [] as LibraryItems;
    return JSON.parse(fs.readFileSync(filePath, "utf8"))
      .libraryItems as LibraryItems;

    // let libs = fs.readdirSync(folderPath);
    // for (let lib of libs) {
    //   let filePath = path.join(folderPath, lib);
    //   let json = JSON.parse(fs.readFileSync(filePath, "utf8"));
    //   items = items.concat(json.libraryItems);
    // }
    // return items;
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
      let filePath = path.join(storagePath, "library.excalidrawlib");
      let jsonString = serializeLibraryAsJSON(items);
      fs.writeFileSync(filePath, jsonString);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    getNote(props.noteId).then((note: Note | undefined) => {
      if (!note || notePath) return;
      setNotePath(note.path);
    });
  }, [props.noteId]);

  const initialData = loadExcalidraw();
  if (initialData) initialData.libraryItems = loadExcalidrawLibrary();
  console.log("initialData", initialData);

  return notePath && props.visible ? (
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
