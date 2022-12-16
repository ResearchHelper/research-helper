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
        <q-btn-toggle
          v-model="leftMenu"
          unelevated
          square
          :ripple="false"
          clearable
          :options="[{ icon: 'account_tree', value: true }]"
        />
        <q-btn
          unelevated
          square
          :ripple="false"
          icon="settings"
          @click="$refs.GLayoutRoot.addGLComponent('SettingPage', 'Settings')"
        />
      </div>
    </template>
    <template v-slot:after>
      <q-splitter
        :limits="[0, 30]"
        emit-immediately
        v-model="stateStore.leftMenuSize"
        @update:model-value="$refs.GLayoutRoot.resize()"
      >
        <template v-slot:before> <ProjectTree /> </template>
        <template v-slot:after>
          <GLayout
            ref="GLayoutRoot"
            glc-path="./"
            style="width: 100%; height: 100vh"
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

  computed: {
    leftMenu: {
      get() {
        return this.stateStore.leftMenuSize > 0;
      },

      set(show) {
        this.stateStore.leftMenuSize = !!show ? 20 : 0;
        this.$nextTick(() => {
          this.$refs.GLayoutRoot.resize();
        });
      },
    },
  },

  watch: {
    "stateStore.workingProjectId"(projectId, _) {
      getProject(projectId).then((project) => {
        this.$refs.GLayoutRoot.addGLComponent("ReaderPage", project.title);
      });
    },
  },

  mounted() {
    const config = {
      settings: {
        showPopoutIcon: false,
        showMaximiseIcon: false,
        // must have close icon otherwise the last tab can't close
        showCloseIcon: true,
      },
      dimensions: {
        borderWidth: 3,
        headerHeight: 36,
      },
      root: {
        type: "stack",
        content: [
          {
            type: "component",
            title: "Library",
            componentType: "LibraryPage",
          },
          {
            type: "component",
            title: "GraphView",
            componentType: "LibraryPage",
          },
        ],
      },
    };

    this.$refs.GLayoutRoot.loadGLLayout(config);
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
