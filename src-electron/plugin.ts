/* eslint-disable */
import path from "path";
import fs from "fs";
import { ipcRenderer } from "electron";
import { BrowserWindow } from "@electron/remote";

interface Plugin {
  // name: string;
  // id: string;
  init: () => void;
  buttons: Button[];
  views: View[];
}

interface Button {
  icon: string;
  onClick: () => void;
}

interface View {
  mount: (parent: HTMLElement) => void;
}

class PluginManager {
  plugins: Map<string, Plugin> = new Map();

  async loadPlugins() {
    this.plugins = new Map();

    const module = await import(
      `/home/huntfeng/Desktop/test-storage/plugins/example-plugin/index.js`
    );
    const manifest = await import(
      `/home/huntfeng/Desktop/test-storage/plugins/example-plugin/manifest.json`
    );
    const plugin = module.default;
    this.plugins.set(manifest.id, new plugin());
  }

  initPlugin(id: string) {
    let plugin = this.plugins.get(id);
    if (!plugin) return;
    plugin.init();
  }
}

const pluginManager = new PluginManager();
pluginManager.loadPlugins();

const pluginAPI = {
  listPlugins() {
    console.log(pluginManager.plugins);
  },

  initPlugin(id: string) {
    pluginManager.initPlugin(id);
  },

  getBtns(id: string) {
    return pluginManager.plugins.get(id)?.buttons;
  },

  getViews(id: string) {
    return pluginManager.plugins.get(id)?.views;
  },
};

export default pluginAPI;
