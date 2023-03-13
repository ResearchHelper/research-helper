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
          <div class="q-ml-sm">{{ $t("research-helper") }}</div>
        </div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        {{ $t("current-version-version", [version]) }}
        <q-btn
          v-if="!isUpdateAvailable"
          unelevated
          square
          :ripple="false"
          no-caps
          :label="$t('check-for-updates')"
          color="primary"
          @click="checkForUpdates"
        />
        <q-btn
          v-else
          unelevated
          square
          :ripple="false"
          no-caps
          :label="$t('install-updates')"
          color="primary"
          @click="downloadUpdate"
        />
        <div>{{ updateMsg }}</div>
      </q-card-section>
    </q-card>
  </div>
</template>
<script>
export default {
  data() {
    return {
      version: "",
      updateMsg: "",
      isUpdateAvailable: false,
    };
  },

  mounted() {
    this.version = window.updater.versionInfo();

    window.updater.updateAvailable((event, isAvailable) => {
      console.log("isavailable", isAvailable)
      this.isUpdateAvailable = isAvailable;
    });

    window.updater.updateMessage((event, info) => {
      console.log(info);
      this.updateMsg = info;
    });
  },

  methods: {
    checkForUpdates() {
      window.updater.checkForUpdates();
    },

    downloadUpdate() {
      window.updater.downloadUpdate();
    },
  },
};
</script>
<style scoped>
.card {
  background: var(--color-settings-card-bkgd);
}
</style>
