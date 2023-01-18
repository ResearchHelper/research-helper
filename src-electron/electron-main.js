import { app, BrowserWindow, nativeTheme, shell, Menu } from "electron";
import { initialize, enable } from "@electron/remote/main";
import path from "path";
import os from "os";

initialize();

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

try {
  if (platform === "win32" && nativeTheme.shouldUseDarkColors === true) {
    require("fs").unlinkSync(
      path.join(app.getPath("userData"), "DevTools Extensions")
    );
  }
} catch (_) {}

let mainWindow;

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    icon: path.resolve(__dirname, "icons/icon.png"), // tray icon
    width: 1600,
    height: 900,
    // frame: false,
    autoHideMenuBar: true,
    useContentSize: true,
    webPreferences: {
      contextIsolation: true,
      // More info: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
    },
  });

  enable(mainWindow.webContents);
  mainWindow.loadURL(process.env.APP_URL);

  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools();
  } else {
    // we're on production; no access to devtools pls
    mainWindow.webContents.on("devtools-opened", () => {
      mainWindow.webContents.closeDevTools();
    });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// no new window is allowed to create
app.on("web-contents-created", (e, webContents) => {
  webContents.on("new-window", (event, url) => {
    event.preventDefault();
    if (process.env.DEV) {
      // in dev mode, every incomplete link with have
      // base_url http://localhost:port
      url = url.replace(process.env.APP_URL + "/", "");
    }
    try {
      new URL(url);
      shell.openExternal(url); // a valid external url
    } catch (error) {
      // not a valid url, do nothing
    }
  });
});
