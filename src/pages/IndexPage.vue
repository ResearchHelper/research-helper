<template>
  <q-splitter
    :model-value="56"
    unit="px"
    :separator-style="{ cursor: 'default' }"
  >
    <template v-slot:before>
      <div
        style="height: calc(100vh - 32px)"
        class="column justify-between"
      >
        <div>
          <q-btn
            icon="home"
            class="bg-secondary"
            :ripple="false"
            square
            @click="setComponent('library')"
          >
            <q-tooltip>Show Library Page</q-tooltip>
          </q-btn>
          <q-btn-toggle
            v-model="leftMenu"
            unelevated
            square
            :ripple="false"
            clearable
            :options="[{ icon: 'account_tree', value: true }]"
          />
        </div>
        <q-btn
          unelevated
          square
          :ripple="false"
          icon="settings"
          @click="setComponent('settings')"
        />
      </div>
    </template>
    <template v-slot:after>
      <q-splitter
        :limits="[0, 30]"
        emit-immediately
        v-model="leftMenuSize"
        @update:model-value="$refs.GLayoutRoot.resize()"
      >
        <template v-slot:before>
          <ProjectTree
            @openProject="(projectId) => setComponent(projectId)"
            @closeProject="(projectId) => removeComponent(projectId)"
            ref="tree"
          />
        </template>
        <template v-slot:after>
          <GLayout
            ref="GLayoutRoot"
            glc-path="./"
            style="width: 100%; height: calc(100vh - 32px)"
            v-model:workingItemId="stateStore.workingItemId"
            @layoutchanged="saveLayout"
          ></GLayout>
        </template>
      </q-splitter>
    </template>
  </q-splitter>
</template>

<script>
import { useQuasar } from "quasar";

import ProjectTree from "src/components/ProjectTree.vue";

import GLayout from "./GLayout.vue";
import "golden-layout/dist/css/goldenlayout-base.css";
import "golden-layout/dist/css/themes/goldenlayout-dark-theme.css";

import { useStateStore } from "src/stores/appState";
import { getProject } from "src/backend/project/project";
import { getLayout, updateLayout } from "src/backend/layout";

export default {
  components: {
    GLayout,
    ProjectTree,
  },

  setup() {
    const $q = useQuasar();
    $q.dark.set(true); // or false or "auto"
    // $q.dark.toggle();

    const stateStore = useStateStore();
    return { stateStore };
  },

  data() {
    return {
      leftMenuSize: 0,
    };
  },

  computed: {
    leftMenu: {
      get() {
        return this.leftMenuSize > 0 || this.stateStore.showLeftMenu;
      },

      set(visible) {
        this.stateStore.showLeftMenu = visible;
        if (visible) {
          this.leftMenuSize = this.stateStore.leftMenuSize;
        } else {
          this.stateStore.leftMenuSize = this.leftMenuSize;
          this.leftMenuSize = 0;
        }
        this.$nextTick(() => {
          this.$refs.GLayoutRoot.resize();
        });
      },
    },
  },

  watch: {
    "stateStore.openItemId"(id) {
      this.setComponent(id);
    },
  },

  async mounted() {
    const layout = await getLayout();
    await this.$refs.GLayoutRoot.loadGLLayout(layout.config);
  },

  methods: {
    /**
     * Set focus to component with specified id
     * create it if it doesn't exist
     * @param {String} id
     */
    async setComponent(id) {
      console.log("setting component:", id);
      let componentType = "";
      let title = "";
      if (id == "library") {
        componentType = "LibraryPage";
        title = "Library";
      } else if (id == "settings") {
        componentType = "SettingPage";
        title = "Settings";
      } else {
        let item = await getProject(id);
        if (item.dataType == "project") {
          componentType = "ReaderPage";
          title = item.title;
        } else if (item.dataType == "note") {
          componentType = "NotePage";
          title = item.label;
        }
      }

      this.$refs.GLayoutRoot.addGLComponent(componentType, title, id);
    },

    removeComponent(id) {
      this.$refs.GLayoutRoot.removeGLComponent(id);
    },

    async saveLayout() {
      if (!this.$refs.GLayoutRoot.initialized) return;
      let config = this.$refs.GLayoutRoot.getLayoutConfig();
      await updateLayout(config);
    },
  },
};
</script>

<style lang="scss">
/* hide the global scrollbar */
html {
  overflow: hidden;
}
.lm_close {
  // we don't need this button, but we must keep it due to some bug
  visibility: hidden;
}
.lm_tab {
  height: 36px !important;
  min-width: 100px;
  max-width: 150px;
  display: flex;
  align-items: center;
  white-space: nowrap;
}
.lm_close_tab {
  top: unset !important;
}
.lm_active {
  background-color: #222222 !important;
  box-shadow: 2px -2px 2px rgb(0 0 0 / 30%) !important;
}
.lm_header {
  background: rgb(48, 48, 48);
}
.lm_header [class^="lm_"] {
  box-sizing: inherit !important;
}
</style>
