<template>
  <div
    style="height: 100vh; background: var(--color-leftmenu-bkgd)"
    class="column justify-between"
  >
    <div>
      <q-btn-toggle
        v-model="stateStore.ribbonToggledBtnUid"
        style="width: 40px; display: block"
        spread
        unelevated
        square
        clearable
        :ripple="false"
        :options="toggleBtns"
      >
        <template
          v-for="toggleBtn in toggleBtns"
          v-slot:[toggleBtn.slot]
        >
          <!-- icons do not render properly using the normal way -->
          <!-- I need to render icons in templates -->
          <q-icon :name="toggleBtn._icon">
            <q-tooltip>
              {{ toggleBtn.tooltip }}
            </q-tooltip>
          </q-icon>
        </template>
      </q-btn-toggle>
    </div>

    <div>
      <q-btn
        v-for="(btn, index) in pluginBtns"
        :key="index"
        style="width: 40px"
        flat
        square
        :icon="btn.icon"
        @click="onPluginBtnClick(btn)"
      >
        <q-tooltip>{{ btn.tooltip }}</q-tooltip>
      </q-btn>
      <q-btn
        style="width: 40px"
        flat
        square
        icon="home"
        :ripple="false"
        @click="
          $emit('openPage', {
            pageId: 'library',
            pageLabel: t('library'),
            pageType: 'LibraryPage',
          })
        "
      >
        <q-tooltip>{{ $t("library") }}</q-tooltip>
      </q-btn>
      <q-btn
        style="width: 40px"
        flat
        square
        :ripple="false"
        icon="help"
        @click="
          $emit('openPage', {
            pageId: 'help',
            pageLabel: t('help'),
            pageType: 'HelpPage',
          })
        "
      >
        <q-tooltip>{{ $t("help") }}</q-tooltip>
      </q-btn>
      <q-btn
        style="width: 40px"
        flat
        square
        :ripple="false"
        icon="settings"
        @click="
          $emit('openPage', {
            pageId: 'settings',
            pageLabel: t('settings'),
            pageType: 'SettingsPage',
          })
        "
      >
        <q-badge
          v-if="isUpdateAvailable"
          floating
          rounded
          color="blue"
          style="top: 10%; right: 10%"
        ></q-badge>
        <q-tooltip>{{ $t("settings") }}</q-tooltip>
      </q-btn>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import pluginManager from "src/backend/plugin";
import { Button, ComponentName, ToggleButton } from "src/backend/database";
import { useI18n } from "vue-i18n";
import { useStateStore } from "src/stores/appState";

const stateStore = useStateStore();
const { t, locale } = useI18n({ useScope: "global" });

const props = defineProps({
  isLeftMenuVisible: { type: Boolean, required: true },
});
const emit = defineEmits(["update:isLeftMenuVisible", "openPage"]);

const isUpdateAvailable = ref(false);
const pluginBtns = ref<Button[]>([]);
const clickedBtnUid = ref("");
const toggleBtns = ref<
  { _icon: string; value: string; tooltip: string; slot: string }[]
>([]);

// change tooltip locale
watch(
  () => locale.value,
  (_) => {
    let toggleBtn = toggleBtns.value.find(
      (tb) => tb.value == "projectNavigator"
    );
    if (toggleBtn) toggleBtn.tooltip = t("openedProjects");
  }
);

watch(
  () => stateStore.ribbonToggledBtnUid,
  (id: string | undefined) => {
    stateStore.showLeftMenu = !!id;
  }
);

// whenever the status of plugins are changed, reload the plugins
watch(
  pluginManager.statusMap,
  (_) => {
    mountBtns();
  },
  { deep: true }
);

function onPluginBtnClick(btn: Button) {
  clickedBtnUid.value = btn.uid;
  btn.click();
}

function mountBtns() {
  let buttons = pluginManager.getBtns(ComponentName.RIBBON);
  pluginBtns.value = buttons.btns;
  toggleBtns.value = [];
  toggleBtns.value.push({
    _icon: "account_tree",
    value: "projectNavigator",
    tooltip: t("openedProjects"),
    slot: "projectNavigator",
  });
  for (let toggleBtn of buttons.toggleBtns) {
    toggleBtns.value.push({
      _icon: toggleBtn.icon,
      value: toggleBtn.uid,
      tooltip: toggleBtn.tooltip,
      slot: toggleBtn.uid,
    });
  }
  console.log(toggleBtns.value);
}

onMounted(() => {
  mountBtns();

  // check if update is available
  // if available, show a blue dot on settings icon
  setTimeout(() => {
    window.updater.updateAvailable((event, isAvailable: boolean) => {
      isUpdateAvailable.value = isAvailable;
    });
  }, 1000);
});
</script>
<style scoped lang="scss">
.q-icon {
  justify-content: unset;
}
</style>
