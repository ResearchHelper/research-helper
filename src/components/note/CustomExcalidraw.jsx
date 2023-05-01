import React from "react";
import {
  Excalidraw,
  MainMenu,
  serializeAsJSON,
  serializeLibraryAsJSON,
} from "@excalidraw/excalidraw";
import "src/css/excalidraw/theme.scss";
const fs = window.fs;

// TODO: save (load) json data to (from) correct path
// in order to do this, we need to get projectId from the app
// checkout the way to pass in data from vue to react via props
// https://github.com/devilwjp/veaury#usage-of-renderreactnode

// TODO: create debounce function for saveScene
// TODO: save (load) excalidraw library data

let init = false;

function loadScene() {
  try {
    return JSON.parse(fs.readFileSync("src/components/note/test.json", "utf8"));
  } catch (error) {
    return {};
  } finally {
    setTimeout(() => {
      init = true;
    }, 100);
  }
}

async function saveScene(elements, state) {
  if (!init) return;
  const json = serializeAsJSON(elements, state);
  fs.writeFileSync("src/components/note/test.json", json);
}

export default function CustomExcalidraw() {
  const [excalidrawAPI, setExcalidrawAPI] = React.useState(null);

  return (
    <Excalidraw
      ref={(api) => setExcalidrawAPI(api)}
      initialData={loadScene()}
      onChange={(elements, state) => saveScene(elements, state)}
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
  );
}
