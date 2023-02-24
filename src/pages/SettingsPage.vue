<template>
  <q-splitter
    v-model="leftMenuSize"
    class="fit"
    :separator-style="{ cursor: 'default' }"
  >
    <template v-slot:before>
      <div
        style="height: 100%; background: var(--color-settings-tabs-area-bkgd)"
      >
        <q-tabs
          v-model="tab"
          vertical
          no-caps
          stretch
          inline-label
          align="left"
          indicator-color="transparent"
          active-color="primary"
        >
          <q-tab
            name="general"
            :ripple="false"
          >
            <q-icon
              name="bi-grid-1x2"
              size="1.2rem"
            />
            <div style="font-size: 1rem; padding-left: 0.5rem">General</div>
          </q-tab>
          <q-tab
            name="about"
            :ripple="false"
          >
            <q-icon
              name="bi-info-circle"
              size="1.2rem"
            ></q-icon>
            <div style="font-size: 1rem; padding-left: 0.5rem">About</div>
          </q-tab>
        </q-tabs>
      </div>
    </template>

    <template v-slot:after>
      <div class="fit row">
        <q-tab-panels
          style="background: var(--color-settings-tab-panel-bkgd)"
          v-model="tab"
          vertical
          class="fit"
        >
          <q-tab-panel name="general">
            <GeneralTab />
          </q-tab-panel>
          <q-tab-panel name="about">
            <AboutTab />
          </q-tab-panel>
        </q-tab-panels>
      </div>
    </template>
  </q-splitter>
</template>

<script>
import GeneralTab from "src/components/settings/GeneralTab.vue";
import AboutTab from "src/components/settings/AboutTab.vue";

export default {
  components: {
    GeneralTab,
    AboutTab,
  },

  data() {
    return {
      leftMenuSize: 20,
      tab: "general",
    };
  },
};
</script>
