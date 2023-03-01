<template>
  <q-carousel
    model-value="start"
    style="height: 100vh"
  >
    <q-carousel-slide
      name="start"
      class="column no-wrap flex-center"
    >
      <h2>
        Welcome to Research Helper
        <q-icon class="q-ml-lg">
          <img
            src="~assets/logo.svg"
            alt="logo"
          />
        </q-icon>
      </h2>
      <div></div>

      <div class="text-h5">Select a folder to fill up your knowledge</div>
      <q-input
        style="width: 60%"
        dense
        outlined
        readonly
        v-model="path"
        @click="showFolderPicker"
      >
        <template v-slot:append>
          <q-btn
            flat
            :ripple="false"
            label="Browse"
            @click="showFolderPicker"
          />
        </template>
      </q-input>
      <q-btn
        unelevated
        :disable="!path"
        square
        :color="path ? 'primary' : 'grey'"
        size="xl"
        class="q-mt-xl"
        :ripple="false"
        label="Start!"
        @click="start"
      />
    </q-carousel-slide>
  </q-carousel>
</template>
<script>
export default {
  emits: ["selectPath"],

  data() {
    return {
      path: "",
    };
  },

  methods: {
    showFolderPicker() {
      let result = window.folderPicker.show();
      if (result !== undefined && !!result[0]) this.path = result[0];
    },

    start() {
      this.$emit("selectPath", this.path);
    },
  },
};
</script>
