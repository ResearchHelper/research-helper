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
          label="$t('create-a-new-folder-for-this-collection')"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          flat
          v-close-popup
          :ripple="false"
          label="$t('cancel')"
          @click="cancel"
        />
        <q-btn
          flat
          v-close-popup
          :ripple="false"
          label="$t('confirm')"
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
      isCreateFolder: true,
    };
  },

  methods: {
    confirm() {
      this.$emit("confirm", this.isCreateFolder);
    },

    cancel() {
      this.$emit("update:show", false);
    },
  },
};
</script>
