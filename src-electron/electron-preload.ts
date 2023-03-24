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
 *
 * WARNING!
 * If accessing Node functionality (like importing @electron/remote) then in your
 * electron-main.ts you will need to set the following when you instantiate BrowserWindow:
 *
 * mainWindow = new BrowserWindow({
 *   // ...
 *   webPreferences: {
 *     // ...
 *     sandbox: false // <-- to be able to import @electron/remote in preload script
 *   }
 * }
 */
import { contextBridge, shell, ipcRenderer } from "electron";
import { app, dialog, BrowserWindow } from "@electron/remote";
import fs from "fs";
import path from "path";

// inject these libraries in preload, otherwise they are externalized
contextBridge.exposeInMainWorld("fs", fs);
contextBridge.exposeInMainWorld("path", path);

// quasar's filePicker cannot pick folder only, use electron's dialog
contextBridge.exposeInMainWorld("fileBrowser", {
  showFolderPicker() {
    const mainWindow = BrowserWindow.getFocusedWindow();
    if (mainWindow === null) return;
    const result = dialog.showOpenDialogSync(mainWindow, {
      properties: ["openDirectory", "createDirectory"],
    });
    return result;
  },

  showFilePicker(multiSelections = false) {
    const mainWindow = BrowserWindow.getFocusedWindow();
    if (mainWindow === null) return;
    const result = dialog.showOpenDialogSync(mainWindow, {
      properties: multiSelections
        ? ["openFile", "multiSelections"]
        : ["openFile"],
      filters: [{ name: "*.pdf", extensions: ["pdf"] }],
    });
    return result;
  },
});

// use electron's shell to open link in user's default browser
contextBridge.exposeInMainWorld("browser", {
  openURL(url: string) {
    shell.openExternal(url);
  },
});

// auto updater
contextBridge.exposeInMainWorld("updater", {
  versionInfo() {
    return app.getVersion();
  },

  updateMessage(callback: (e: Event, msg: string) => void) {
    ipcRenderer.on("updateMessage", callback);
  },

  updateAvailable(callback: (e: Event, msg: string) => void) {
    ipcRenderer.on("updateAvailable", callback);
  },

  checkForUpdates() {
    ipcRenderer.send("checkForUpdates");
  },

  downloadUpdate() {
    ipcRenderer.send("downloadUpdate");
  },
});
