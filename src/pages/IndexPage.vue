<template>
  <div>
    <SystemBar />
    <!-- do not pass in the model Value because we want it fixed -->
    <q-splitter :separator-style="{ cursor: 'default' }">
      <template v-slot:before>
        <q-tabs
          v-model="stateStore.currentPage"
          vertical
        >
          <div>
            <q-tab
              name="library"
              icon="library_books"
              :ripple="false"
              @click="stateStore.setCurrentPage('library')"
            />
            <q-tab
              name="reader"
              icon="auto_stories"
              :ripple="false"
              :disable="!!!stateStore.workingProjectId"
              @click="stateStore.setCurrentPage('reader')"
            />
          </div>
          <div>
            <q-tab
              name="graphview"
              icon="hub"
              :ripple="false"
              @click="stateStore.setCurrentPage('graphview')"
            />
            <q-tab
              name="settings"
              icon="settings"
              :ripple="false"
              @click="stateStore.setCurrentPage('settings')"
            />
          </div>
        </q-tabs>
      </template>
      <template v-slot:after>
        <q-tab-panels
          v-model="stateStore.currentPage"
          vertical
          transition-duration="0"
          class="fit"
        >
          <q-tab-panel name="library">
            <LibraryPage />
          </q-tab-panel>

          <q-tab-panel name="reader">
            <ReaderPage />
          </q-tab-panel>

          <q-tab-panel name="graphview"> <GraphView /> </q-tab-panel>
          <q-tab-panel name="settings"> Settings Page </q-tab-panel>
        </q-tab-panels>
      </template>
    </q-splitter>
  </div>
</template>

<script>
import { useStateStore } from "src/stores/appState";
import { useQuasar } from "quasar";
import SystemBar from "../components/SystemBar.vue";
import LibraryPage from "./LibraryPage.vue";
import ReaderPage from "./ReaderPage.vue";
import GraphView from "src/components/GraphView.vue";

export default {
  setup() {
    const $q = useQuasar();
    $q.dark.set(true); // or false or "auto"
    // $q.dark.toggle();

    const stateStore = useStateStore();
    return { stateStore };
  },

  components: {
    SystemBar,
    LibraryPage,
    ReaderPage,
    GraphView,
  },
};
</script>

<style>
/* hide the global scrollbar */
html {
  overflow: hidden;
}
/* remove padding of tab panel */
.q-tab-panel {
  padding: 0;
}
/* remove scrollbar for q-tab-panel */
.q-panel.scroll {
  overflow: hidden;
}
</style>
