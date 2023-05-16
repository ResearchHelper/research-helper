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
import { contextBridge, shell, ipcRenderer, FileFilter } from "electron";
import { app, dialog, BrowserWindow } from "@electron/remote";
import fs from "fs";
import path from "path";

const fileBrowser = {
  showFolderPicker() {
    const mainWindow = BrowserWindow.getFocusedWindow();
    if (mainWindow === null) return;
    const result = dialog.showOpenDialogSync(mainWindow, {
      properties: ["openDirectory", "createDirectory"],
    });
    return result;
  },

  /**
   * Show file browser
   * multiSelections - can user select multiple files
   * filters - e.g. [{ name: "*.pdf", extensions: ["pdf"] }]
   * @param config
   * @returns filePaths
   */
  showFilePicker(config: {
    multiSelections: boolean;
    filters: FileFilter[];
  }): string[] | undefined {
    const mainWindow = BrowserWindow.getFocusedWindow();
    if (mainWindow === null) return;
    const result = dialog.showOpenDialogSync(mainWindow, {
      properties: config.multiSelections
        ? ["openFile", "multiSelections"]
        : ["openFile"],
      filters: config.filters,
    });
    return result;
  },
};

const browser = {
  openURL(url: string) {
    shell.openExternal(url);
  },
};

const updater = {
  versionInfo() {
    return app.getVersion();
  },

  updateMessage(callback: (e: Event, msg: string) => void) {
    ipcRenderer.on("updateMessage", callback);
  },

  updateAvailable(callback: (e: Event, available: boolean) => void) {
    ipcRenderer.on("updateAvailable", callback);
  },

  checkForUpdates() {
    ipcRenderer.send("checkForUpdates");
  },

  downloadUpdate() {
    ipcRenderer.send("downloadUpdate");
  },
};

// inject these libraries in preload, otherwise they are externalized
contextBridge.exposeInMainWorld("fs", fs);
contextBridge.exposeInMainWorld("path", path);

// quasar's filePicker cannot pick folder only, use electron's dialog
contextBridge.exposeInMainWorld("fileBrowser", fileBrowser);

// use electron's shell to open link in user's default browser
contextBridge.exposeInMainWorld("browser", browser);

// auto updater
contextBridge.exposeInMainWorld("updater", updater);

// ctrl/⌘ + and ctrl/⌘ - to zoom in and out
document.addEventListener("keydown", (e: KeyboardEvent) => {
  if (!e.ctrlKey && !e.metaKey) return; // ctrl for win and linux, metaKey for mac
  if (e.key === "+" || e.key === "=") {
    let win = BrowserWindow.getFocusedWindow();
    let currentZoomFactor = win?.webContents.getZoomFactor();
    if (currentZoomFactor)
      win?.webContents.setZoomFactor(currentZoomFactor + 0.1);
  } else if (e.key === "-") {
    // prevent the default ctrl - zoom out and do it our self
    // since the default ctrl - does not work if we press - on numpad
    e.preventDefault();
    let win = BrowserWindow.getFocusedWindow();
    let currentZoomFactor = win?.webContents.getZoomFactor();
    if (currentZoomFactor)
      win?.webContents.setZoomFactor(currentZoomFactor - 0.1);
  }
});

// declare this global
declare global {
  // also export it
  // we can import it in src/env.d.ts so we can intellisense
  export interface Window {
    fs: typeof fs;
    path: typeof path;
    fileBrowser: typeof fileBrowser;
    browser: typeof browser;
    updater: typeof updater;
    // for test
    Cypress: typeof Cypress;
  }
}
