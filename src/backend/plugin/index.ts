import { ref } from "vue";
import { PluginMeta, PluginStatusMap, Plugin } from "../database";
import { Buffer } from "buffer";
import { getAppState } from "../appState";

class PluginManager {
  storagePath: string = "";
  statusMap = ref<PluginStatusMap>(new Map());
  pluginMetas = ref<PluginMeta[]>([]);
  communityMetas = ref<PluginMeta[]>([]);
  plugins = ref<Map<string, Plugin>>(new Map());

  private async hiddenFolder(): Promise<string> {
    let state = await getAppState();
    let hiddenPath = window.path.join(
      state.settings.storagePath,
      ".research-helper"
    );
    if (!window.fs.existsSync(hiddenPath)) window.fs.mkdirSync(hiddenPath);
    return hiddenPath;
  }

  /**
   * Get the path to `plugins` folder
   * @returns path to `plugins` folder
   */
  private async pluginFolder(): Promise<string> {
    let folderPath = window.path.join(await this.hiddenFolder(), "plugins");
    if (!window.fs.existsSync(folderPath)) window.fs.mkdirSync(folderPath);
    return folderPath;
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

  /**
   * Download 3 files: main.js, styles.css, and manifest.json
   * To update plugin, simply download it again
   */
  async download(meta: PluginMeta) {
    for (let file of ["main.js", "styles.css", "manifest.json"]) {
      let url = `https://github.com/${meta.repo}/releases/latest/download/${file}`;
      let directory = window.path.join(await this.pluginFolder(), meta.id);
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
    let pluginPath = window.path.join(await this.pluginFolder(), meta.id);
    window.fs.rmSync(pluginPath, { recursive: true, force: true });
    await this.saveStatus();
  }

  /**
   * Load all plugins from disk
   * TODO: need to deal with styles.css as well
   */
  async load(pluginId: string, enabled: boolean) {
    let mainJsPath = window.path.join(
      await this.pluginFolder(),
      pluginId,
      "main.js"
    );
    let manifestPath = window.path.join(
      await this.pluginFolder(),
      pluginId,
      "manifest.json"
    );
    const module = await import(
      /* @vite-ignore */
      "file://" + mainJsPath
    );
    const manifest = JSON.parse(
      window.fs.readFileSync(manifestPath, { encoding: "utf-8" })
    );
    const pluginClass = module.default;
    const plugin = new pluginClass();

    this.pluginMetas.value.push(manifest);
    this.plugins.value.set(pluginId, plugin);
    this.toggle(pluginId, enabled);
  }

  /**
   * Load all plugins
   */
  async loadAll() {
    await this.loadStatus();
    for (let [id, status] of this.statusMap.value.entries()) {
      if (!this.plugins.value.has(id)) await this.load(id, status.enabled);
    }
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

    if (enabled) plugin.enable();
    else plugin.disable();
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
}

// plugins
const pluginManager = new PluginManager();
export default pluginManager;
