<template>
  <div>
    <SystemBar />
    <!-- do not pass in the model Value because we want it fixed -->
    <q-splitter
      class="window-height"
      :separator-style="{ cursor: 'default' }"
    >
      <template v-slot:before>
        <q-tabs
          v-model="tab"
          vertical
        >
          <div>
            <q-tab
              name="library"
              icon="library_books"
              :ripple="false"
            />
            <q-tab
              name="reader"
              icon="auto_stories"
              :ripple="false"
            />
          </div>
          <div>
            <q-tab
              name="user"
              icon="account_circle"
              :ripple="false"
            />
            <q-tab
              name="settings"
              icon="settings"
              :ripple="false"
            />
          </div>
        </q-tabs>
      </template>
      <template v-slot:after>
        <q-tab-panels
          v-model="tab"
          animated
          swipeable
          vertical
          transition-duration="0"
          class="window-height"
        >
          <q-tab-panel name="library">
            <LibraryPage />
          </q-tab-panel>

          <q-tab-panel name="reader">
            <ReaderPage />
          </q-tab-panel>

          <q-tab-panel name="user">
            <div class="text-h4 q-mb-md">Movies</div>
            <p>
              Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quis
              praesentium cumque magnam odio iure quidem, quod illum numquam
              possimus obcaecati commodi minima assumenda consectetur culpa fuga
              nulla ullam. In, libero.
            </p>
            <p>
              Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quis
              praesentium cumque magnam odio iure quidem, quod illum numquam
              possimus obcaecati commodi minima assumenda consectetur culpa fuga
              nulla ullam. In, libero.
            </p>
            <p>
              Lorem ipsum dolor sit, amet consectetur adipisicing elit. Quis
              praesentium cumque magnam odio iure quidem, quod illum numquam
              possimus obcaecati commodi minima assumenda consectetur culpa fuga
              nulla ullam. In, libero.
            </p>
          </q-tab-panel>
          <q-tab-panel name="settings">
            <div class="text-h4 q-mb-md">Movies</div>
            sfdsaf
          </q-tab-panel>
        </q-tab-panels>
      </template>
    </q-splitter>
  </div>
</template>

<script>
import { defineComponent, ref } from "vue";
import { useQuasar } from "quasar";
import SystemBar from "../components/SystemBar.vue";
import LibraryPage from "./LibraryPage.vue";
import ReaderPage from "./ReaderPage.vue";

export default defineComponent({
  name: "IndexPage",

  setup() {
    const $q = useQuasar();
    $q.dark.set(true); // or false or "auto"
    // $q.dark.toggle();
  },

  components: {
    SystemBar,
    LibraryPage,
    ReaderPage,
  },

  data() {
    return {
      tab: ref("library"),
    };
  },
});
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
</style>
