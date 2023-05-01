import React from "react";
import { Excalidraw, MainMenu } from "@excalidraw/excalidraw";
import "src/css/excalidraw/theme.scss";

export default function CustomExcalidraw({ initialData, onChange }) {
  const [excalidrawAPI, setExcalidrawAPI] = React.useState(null);
  return (
    <Excalidraw
      ref={(api) => setExcalidrawAPI(api)}
      initialData={initialData}
      onChange={onChange}
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
