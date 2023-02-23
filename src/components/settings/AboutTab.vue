<template>
  <div class="q-pb-md">
    <q-card
      square
      bordered
      flat
      class="q-my-md card"
    >
      <q-card-section>
        <div class="text-h6 row items-center">
          <img
            src="~assets/logo.svg"
            alt="logo"
          />
          <div class="q-ml-sm">Research Helper</div>
        </div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        current version: v0.1.0-alpha
        {{ updateStatus }}
        <q-btn
          flat
          label="Update"
        />
      </q-card-section>
    </q-card>
  </div>
</template>
<script>
export default {
  data() {
    return {
      updateStatus: "",
    };
  },

  mounted() {
    window.updater.updateMessage((info) => {
      this.updateStatus = info;
    });
  },
};
</script>
<style scoped>
.card {
  background: var(--color-settings-card-bkgd);
}
</style>
