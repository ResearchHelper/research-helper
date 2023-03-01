<template>
  <q-dialog :model-value="show">
    <q-card
      square
      style="min-width: 500px"
    >
      <q-card-section>
        <div class="text-h6">Import Collection</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-checkbox
          dense
          v-model="isCreateFolder"
          label="Create a new folder for this collection"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          flat
          v-close-popup
          :ripple="false"
          label="Cancel"
          @click="cancel"
        />
        <q-btn
          flat
          v-close-popup
          :ripple="false"
          label="Confirm"
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
