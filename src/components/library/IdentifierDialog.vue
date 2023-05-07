<template>
  <q-dialog
    :model-value="show"
    @hide="cancel"
  >
    <q-card
      square
      style="min-width: 500px"
    >
      <q-card-section>
        <div class="text-h6">{{ $t("search-identifier") }}</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-input
          outlined
          square
          dense
          autofocus
          class="full-width"
          placeholder="DOI, ISBN, Wikidata, Ris, ..."
          v-model.trim="identifier"
          @keydown.enter="confirm"
          data-cy="identifier-input"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          flat
          v-close-popup
          :ripple="false"
          :label="$t('cancel')"
          @click="cancel"
          data-cy="btn-cancel"
        />
        <q-btn
          flat
          v-close-popup
          :ripple="false"
          :label="$t('confirm')"
          :disable="!identifier"
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

const identifier = ref("");

function confirm() {
  emit("confirm", identifier.value);
  emit("update:show", false);
  identifier.value = "";
}

function cancel() {
  // do nothing, only close the dialog
  emit("update:show", false);
  identifier.value = "";
}
</script>
