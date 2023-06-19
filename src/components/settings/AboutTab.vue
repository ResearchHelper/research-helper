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
        {{ $t("version", [version]) }}
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
          :label="$t('download-updates')"
          color="primary"
          @click="downloadUpdate"
          :disable="disabled"
        />
        <div>{{ updateMsg }}</div>
      </q-card-section>
    </q-card>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";

const version = ref("");
const updateMsg = ref("");
const isUpdateAvailable = ref(false);
const disabled = ref(false);

onMounted(() => {
  version.value = window.updater.versionInfo();

  window.updater.updateAvailable((event, isAvailable) => {
    isUpdateAvailable.value = isAvailable;
  });

  window.updater.updateMessage((event, info) => {
    updateMsg.value = info;
  });
});

function checkForUpdates() {
  window.updater.checkForUpdates();
}

function downloadUpdate() {
  window.updater.downloadUpdate();
  disabled.value = true;
}
</script>
<style scoped>
.card {
  background: var(--color-settings-card-bkgd);
}
</style>
