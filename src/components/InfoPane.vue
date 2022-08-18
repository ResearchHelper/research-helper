<template>
  <q-tabs
    v-model="infoTab"
    dense
  >
    <q-tab
      name="metaInfoTab"
      :ripple="false"
    >
      Meta Info
    </q-tab>
    <q-tab
      name="noteTab"
      :ripple="false"
    >
      Notes
    </q-tab>
  </q-tabs>
  <q-input
    filled
    type="textarea"
  />
  <q-input
    filled
    type="textarea"
  />
  <q-input
    filled
    type="textarea"
  />
</template>

<script>
import { ref } from "vue";

export default {
  data() {
    return {
      infoTab: 0,
    };
  },
};
</script>
