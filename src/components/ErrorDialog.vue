<template>
  <q-dialog
    :model-value="show"
    persistent
    transition-duration="0"
    no-shake
    @hide="close"
  >
    <q-card square>
      <q-card-section>
        <div class="text-h6">
          <q-icon
            name="error"
            color="negative"
          />
          {{ error.name }}
        </div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        {{ error.message }}
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          flat
          dense
          :ripple="false"
          label="OK"
          @click="close"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
<script>
export default {
  props: { show: Boolean, error: Error },
  emits: ["update:show"],

  methods: {
    close() {
      this.$emit("update:show", false);
    },
  },
};
</script>
