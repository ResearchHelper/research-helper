import { app, BrowserWindow, nativeTheme, ipcMain } from "electron";
import { initialize, enable } from "@electron/remote/main";
import { autoUpdater } from "electron-updater";
import path from "path";
import os from "os";

initialize(); // initialize electron remote

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

try {
  if (platform === "win32" && nativeTheme.shouldUseDarkColors === true) {
    require("fs").unlinkSync(
      path.join(app.getPath("userData"), "DevTools Extensions")
    );
  }
} catch (_) {}

let mainWindow: BrowserWindow | undefined;

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    icon: path.resolve(__dirname, "icons/icon.png"), // tray icon
    width: 1600,
    height: 900,
    useContentSize: true,
    autoHideMenuBar: true, // hide menu bar
    webPreferences: {
      contextIsolation: true,
      // More info: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
      preload: path.resolve(
        __dirname,
        process.env.QUASAR_ELECTRON_PRELOAD as string
      ),
      sandbox: false, // to be able to use @electron/remote in preload
      webSecurity: false, // to be able to load image in note editor in dev mode
    },
  });

  enable(mainWindow.webContents); // enable electron remote
  mainWindow.loadURL(process.env.APP_URL as string);

  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools();
  } else {
    // we're on production; no access to devtools pls
    mainWindow.webContents.on("devtools-opened", () => {
      mainWindow?.webContents.closeDevTools();
    });
  }

  mainWindow.on("closed", () => {
    mainWindow = undefined;
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === undefined) {
    createWindow();
  }
});

// autoUpdater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

ipcMain.on("checkForUpdates", (event) => {
  autoUpdater.checkForUpdates();
});
ipcMain.on("downloadUpdate", (event) => {
  autoUpdater.downloadUpdate();
});

autoUpdater.on("checking-for-update", () => {
  if (mainWindow === undefined) return;
  mainWindow.webContents.send("updateMessage", "Checking for updates");
});
autoUpdater.on("update-available", (info) => {
  if (mainWindow === undefined) return;
  mainWindow.webContents.send("updateAvailable", true);
  mainWindow.webContents.send(
    "updateMessage",
    `Newer version ${info.version} is available`
  );
});
autoUpdater.on("update-not-available", (info) => {
  if (mainWindow === undefined) return;
  mainWindow.webContents.send("updateAvailable", false);
  mainWindow.webContents.send("updateMessage", "App is up-to-date");
});
autoUpdater.on("download-progress", (info) => {
  if (mainWindow === undefined) return;
  mainWindow.webContents.send(
    "updateMessage",
    `Downloading: ${Math.round(info.percent)}%`
  );
});
autoUpdater.on("update-downloaded", (event) => {
  if (mainWindow === undefined) return;
  mainWindow.webContents.send(
    "updateMessage",
    "Download complete, restart app to install."
  );
});
autoUpdater.on("error", (error, info) => {
  if (mainWindow === undefined) return;
  mainWindow.webContents.send("updateMessage", info);
});

// ctrl/⌘ + and ctrl/⌘ - to zoom in and out
document.addEventListener("keydown", (e: KeyboardEvent) => {
  if (!e.ctrlKey && !e.metaKey) return; // ctrl for win and linux, metaKey for mac
  if (e.key === "+" || e.key === "=") {
    console.log("here");
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
