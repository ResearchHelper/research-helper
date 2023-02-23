/**
 * This file is used specifically for security reasons.
 * Here you can access Nodejs stuff and inject functionality into
 * the renderer thread (accessible there through the "window" object)
 *
 * WARNING!
 * If you import anything from node_modules, then make sure that the package is specified
 * in package.json > dependencies and NOT in devDependencies
 *
 * Example (injects window.myAPI.doAThing() into renderer thread):
 *
 *   import { contextBridge } from 'electron'
 *
 *   contextBridge.exposeInMainWorld('myAPI', {
 *     doAThing: () => {}
 *   })
 */
import { contextBridge, shell, ipcRenderer } from "electron";
import { dialog } from "@electron/remote";
import fs from "fs";
import path from "path";

// inject these libraries in preload, otherwise they are externalized
contextBridge.exposeInMainWorld("fs", fs);
contextBridge.exposeInMainWorld("path", path);

// quasar's filePicker cannot pick folder only, use electron's dialog
contextBridge.exposeInMainWorld("folderPicker", {
  show() {
    let result = dialog.showOpenDialogSync(BrowserWindow.getFocusedWindow(), {
      properties: ["openDirectory", "createDirectory"],
    });
    return result;
  },
});

// use electron's shell to open link in user's default browser
contextBridge.exposeInMainWorld("browser", {
  openURL(url) {
    shell.openExternal(url);
  },
});

contextBridge.exposeInMainWorld("updater", {
  updateMessage(callback) {
    ipcRenderer.on("updateMessage", callback);
  },
});
