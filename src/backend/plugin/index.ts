import { ref } from "vue";
import {
  PluginMeta,
  PluginStatusMap,
  Plugin,
  Button,
  View,
  ComponentName,
  ToggleButton,
} from "../database";
import { Buffer } from "buffer";
import { getAppState } from "../appState";
import { useStateStore } from "src/stores/appState";
const stateStore = useStateStore();

const controller = {
  layout: {
    openPage: stateStore.openPage,
    closePage: stateStore.closePage,
    toggleLeftMenu: stateStore.toggleLeftMenu,
    togglePDFMenuView: stateStore.togglePDFMenuView,
  },
  fs: window.fs,
  path: window.path,
};

class PluginManager {
  storagePath: string = "";
  statusMap = ref<PluginStatusMap>(new Map());
  pluginMetas = ref<PluginMeta[]>([]);
  communityMetas = ref<PluginMeta[]>([]);
  plugins = ref<Map<string, Plugin>>(new Map());

  constructor() {
    // create all necessary folders and files
    let hiddenFolder = window.path.join(
      stateStore.settings.storagePath,
      ".research-helper"
    );
    if (!window.fs.existsSync(hiddenFolder)) window.fs.mkdirSync(hiddenFolder);
    let pluginsFolder = window.path.join(hiddenFolder, "plugins");
    if (!window.fs.existsSync(pluginsFolder))
      window.fs.mkdirSync(pluginsFolder);
  }

  /******************************************************
   * Get community metas, download, delete
   ******************************************************/
  /**
   * Filter plugin metas
   * @param text
   * @param local - are we filtering local plugins or community plugins
   */
  filter(text: string | null, local: boolean): PluginMeta[] {
    let metas = local ? this.pluginMetas : this.communityMetas;
    if (!text) return metas.value;
    let re = RegExp(text, "i"); // case insensitive
    return metas.value.filter((meta) => {
      for (let [key, value] of Object.entries(meta)) {
        if ((value as string).search(re) != -1) return true;
      }
    });
  }

  async getCommunityMetas() {
    // if the communityMetas are there, no need to get them again
    if (this.communityMetas.value.length > 0) return;
    try {
      // get community plugins
      let response = await fetch(
        "https://raw.githubusercontent.com/ResearchHelper/community-plugins/main/community-plugins.json"
      );
      this.communityMetas.value = await response.json();
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Download 3 files: main.js, styles.css, and manifest.json
   * To update plugin, simply download it again
   */
  async download(meta: PluginMeta) {
    for (let file of ["main.js", "styles.css", "manifest.json"]) {
      let url = `https://github.com/${meta.repo}/releases/latest/download/${file}`;
      let directory = window.path.join(await this.pluginsFolder(), meta.id);
      let filePath = window.path.join(directory, file);

      if (!window.fs.existsSync(directory)) window.fs.mkdirSync(directory);
      let response = await fetch(url);
      let blob = await response.blob();
      let buffer = Buffer.from(await blob.arrayBuffer());
      window.fs.writeFileSync(filePath, buffer);
    }
    await this.load(meta.id, false); // not yet enabled
    await this.saveStatus();
  }

  /**
   * Delete a plugin on disk
   */
  async delete(meta: PluginMeta) {
    this.statusMap.value.delete(meta.id);
    this.plugins.value.delete(meta.id);
    this.pluginMetas.value = this.pluginMetas.value.filter(
      (m) => m.id != meta.id
    );
    let pluginPath = window.path.join(await this.pluginsFolder(), meta.id);
    window.fs.rmSync(pluginPath, { recursive: true, force: true });
    await this.saveStatus();
  }

  /**************************************************
   * Load, toggle plugins
   **************************************************/
  /**
   * Load all plugins
   */
  async loadAll() {
    await this.loadStatus();
    for (let [id, status] of this.statusMap.value.entries()) {
      if (!this.plugins.value.has(id)) await this.load(id, status.enabled);
    }
  }

  async reloadAll() {
    // clear all data
    this.statusMap.value.clear();
    this.pluginMetas.value = [];
    this.communityMetas.value = [];
    this.plugins.value.clear();

    await this.loadAll();
  }

  /**
   * Load all plugins from disk
   * TODO: need to deal with styles.css as well
   */
  async load(pluginId: string, enabled: boolean) {
    let pluginsFolder = await this.pluginsFolder();
    let pluginPath = window.path.join(pluginsFolder, pluginId);
    let mainJsPath = window.path.join(pluginPath, "main.js");
    let manifestPath = window.path.join(pluginPath, "manifest.json");
    const module = await import(
      /* @vite-ignore */
      "file://" + mainJsPath
    );
    const manifest = JSON.parse(
      window.fs.readFileSync(manifestPath, { encoding: "utf-8" })
    );
    const pluginClass = module.default;
    const plugin = new pluginClass({ pluginId, pluginPath }, controller);

    this.pluginMetas.value.push(manifest);
    this.plugins.value.set(pluginId, plugin);
    this.toggle(pluginId, enabled);
  }

  /**
   * Enable / Disable a plugin
   * @param enabled
   */
  toggle(pluginId: string, enabled: boolean) {
    let plugin = this.plugins.value.get(pluginId);
    if (!plugin) return;

    let status = this.statusMap.value.get(pluginId);
    // if no status, meaning we just downloaded, it shouldn't be updatable
    if (!status) status = { enabled: enabled, updatable: false };
    else status.enabled = enabled;
    this.statusMap.value.set(pluginId, { enabled: enabled, updatable: false });
    this.saveStatus();
    if (enabled) {
      plugin.init();
      plugin.loadSettings();
      plugin.enable();
    } else plugin.disable();
  }

  /**
   * Get plugin status
   * {pluginId: {enabled: boolean, updatable: boolean}}
   */
  async loadStatus() {
    let filePath = window.path.join(
      await this.hiddenFolder(),
      "pluginStatus.json"
    );
    if (!window.fs.existsSync(filePath)) return;
    let statusJson = JSON.parse(
      window.fs.readFileSync(filePath, { encoding: "utf-8" })
    );
    this.statusMap.value = new Map(Object.entries(statusJson));
  }

  async saveStatus() {
    let filePath = window.path.join(
      await this.hiddenFolder(),
      "pluginStatus.json"
    );
    let json = Object.fromEntries(this.statusMap.value);
    window.fs.writeFileSync(filePath, JSON.stringify(json));
  }

  /***********************************************************
   * Getters for buttons and views
   **********************************************************/

  getBtns(componentName: ComponentName) {
    let btns: Button[] = [];
    let toggleBtns: ToggleButton[] = [];
    for (let [pluginId, plugin] of pluginManager.plugins.value.entries()) {
      if (!pluginManager.statusMap.value.get(pluginId)?.enabled) continue;
      let _btns: Button[] = [];
      let _toggleBtns: ToggleButton[] = [];
      switch (componentName) {
        case ComponentName.RIBBON:
          _btns = plugin.ribbonBtns;
          _toggleBtns = plugin.ribbonToggleBtns;
          break;
        case ComponentName.PDF_MENU:
          _btns = plugin.pdfMenuBtns;
          break;
        default:
          _btns = [];
          break;
      }
      for (let btn of _btns) {
        // by preppending pluginId, we make the button id unique
        btn.uid = `${pluginId}-${btn.id}`;
        // need to bind plugin object to click function
        // otherwise `this` keyword is undefined
        btn.click = btn.click.bind(plugin);
        btns.push(btn);
      }
      for (let toggleBtn of _toggleBtns) {
        toggleBtn.uid = `${pluginId}-${toggleBtn.id}`;
        toggleBtns.push(toggleBtn);
      }
    }
    return { btns, toggleBtns };
  }

  getViews(componentName: ComponentName): View[] {
    let views: View[] = [];
    for (let [pluginId, plugin] of pluginManager.plugins.value.entries()) {
      if (!pluginManager.statusMap.value.get(pluginId)?.enabled) continue;
      let _views: View[] = [];
      switch (componentName) {
        case ComponentName.LEFT_MENU:
          _views = plugin.leftMenuViews;
          break;
        case ComponentName.PDF_MENU:
          _views = plugin.pdfMenuViews;
          break;
        case ComponentName.PLUGIN_PAGE:
          _views = plugin.pageViews;
          break;
        default:
          _views = [];
          break;
      }
      for (let view of _views) {
        if (view.buttonId) view.uid = `${pluginId}-${view.buttonId}`;
        view.onMounted = view.onMounted?.bind(plugin);
        view.onBeforeMount = view.onBeforeMount?.bind(plugin);
        view.onUnmounted = view.onUnmounted?.bind(plugin);
        view.onBeforeUnmount = view.onBeforeUnmount?.bind(plugin);
        views.push(view);
      }
    }
    return views;
  }

  getSettings(pluginId: string) {
    let plugin = this.plugins.value.get(pluginId);
    return plugin?.settings || [];
  }

  /*******************************************************
   * Path getters and setter
   *******************************************************/
  changePath(storagePath: string) {
    // must set storagePath manually this way rather than db.get
    // since the database is not updated yet ...
    this.storagePath = storagePath;
  }

  private async hiddenFolder(): Promise<string> {
    let storagePath = this.storagePath;
    if (!storagePath) {
      // don't use stateStore, it's not initialized yet
      let state = await getAppState();
      storagePath = state.settings.storagePath;
    }
    let hiddenPath = window.path.join(storagePath, ".research-helper");
    if (!window.fs.existsSync(hiddenPath)) window.fs.mkdirSync(hiddenPath);
    return hiddenPath;
  }

  /**
   * Get the path to `plugins` folder
   * @returns path to `plugins` folder
   */
  private async pluginsFolder(): Promise<string> {
    let folderPath = window.path.join(await this.hiddenFolder(), "plugins");
    if (!window.fs.existsSync(folderPath)) window.fs.mkdirSync(folderPath);
    return folderPath;
  }
}

// plugins
const pluginManager = new PluginManager();
export default pluginManager;
