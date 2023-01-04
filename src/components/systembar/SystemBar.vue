<template>
  <q-bar class="q-electron-drag">
    <div class="cursor-pointer q-electron-drag--exception">
      File
      <FileMenu />
    </div>

    <div class="cursor-pointer q-electron-drag--exception">
      Edit
      <EditMenu />
    </div>

    <div class="cursor-pointer q-electron-drag--exception">
      View
      <ViewMenu />
    </div>

    <div class="cursor-pointer q-electron-drag--exception">
      Help
      <HelpMenu />
    </div>

    <q-space />

    Research Helper v1.0

    <q-space />

    <q-btn
      dense
      flat
      icon="minimize"
      @click="minimize"
    />
    <q-btn
      dense
      flat
      icon="crop_square"
      @click="toggleMaximize"
    />
    <q-btn
      dense
      flat
      icon="close"
      @click="closeApp"
    />
  </q-bar>
</template>

<script>
import FileMenu from "./FileMenu.vue";
import EditMenu from "./EditMenu.vue";
import ViewMenu from "./ViewMenu.vue";
import HelpMenu from "./HelpMenu.vue";

export default {
  components: {
    FileMenu,
    EditMenu,
    ViewMenu,
    HelpMenu,
  },

  setup() {
    function minimize() {
      if (process.env.MODE === "electron") {
        window.myWindowAPI.minimize();
      }
    }

    function toggleMaximize() {
      if (process.env.MODE === "electron") {
        window.myWindowAPI.toggleMaximize();
      }
    }

    function closeApp() {
      if (process.env.MODE === "electron") {
        window.myWindowAPI.close();
      }
    }

    return { minimize, toggleMaximize, closeApp };
  },
};
</script>
