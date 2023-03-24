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
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          flat
          v-close-popup
          :ripple="false"
          :label="$t('cancel')"
          @click="cancel"
        />
        <q-btn
          flat
          v-close-popup
          :ripple="false"
          :label="$t('confirm')"
          @click="confirm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
<script>
export default {
  props: { show: Boolean },
  emits: ["update:show", "confirm"],

  data() {
    return {
      identifier: "",
    };
  },

  methods: {
    confirm() {
      this.$emit("confirm", this.identifier);
      this.$emit("update:show", false);
      this.identifier = "";
    },

    cancel() {
      // do nothing, only close the dialog
      this.$emit("update:show", false);
      this.identifier = "";
    },
  },
};
</script>
