<template>
  <q-dialog :model-value="show">
    <q-card
      square
      style="min-width: 500px"
    >
      <q-card-section>
        <div class="text-h6">{{ $t("import-collection") }}</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-checkbox
          dense
          v-model="isCreateFolder"
          :label="$t('create-a-new-folder-for-this-collection')"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          flat
          square
          v-close-popup
          :ripple="false"
          :label="$t('cancel')"
          @click="cancel"
          data-cy="btn-cancel"
        />
        <q-btn
          flat
          square
          v-close-popup
          :ripple="false"
          :label="$t('confirm')"
          @click="confirm"
          data-cy="btn-confirm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps({ show: Boolean });
const emit = defineEmits(["update:show", "confirm"]);

const isCreateFolder = ref(true);

function confirm() {
  emit("confirm", isCreateFolder.value);
  emit("update:show", false);
}

function cancel() {
  emit("update:show", false);
}
</script>
