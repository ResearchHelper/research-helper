<template>
  <q-splitter
    v-model="leftMenuSize"
    class="fit"
    :separator-style="{ cursor: 'default' }"
  >
    <template v-slot:before>
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
      </q-tabs>
    </template>

    <template v-slot:after>
      <div class="fit row">
        <q-tab-panels
          v-model="tab"
          vertical
          class="fit"
        >
          <q-tab-panel name="general">
            <GeneralTab />
          </q-tab-panel>
        </q-tab-panels>
      </div>
    </template>
  </q-splitter>
</template>

<script>
import GeneralTab from "src/components/settings/GeneralTab.vue";

export default {
  components: {
    GeneralTab,
  },

  data() {
    return {
      leftMenuSize: 20,
      tab: "general",
    };
  },
};
</script>
