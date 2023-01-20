<template>
  <q-dialog
    :model-value="show"
    @hide="cancel"
  >
    <q-card style="min-width: 300px">
      <q-card-section> <div class="text-h6">Options</div> </q-card-section>
      <q-card-section class="q-pt-none">
        <div class="row items-center">
          <div class="col-auto">Format:</div>
          <q-select
            class="q-ml-sm col"
            outlined
            dense
            options-dense
            :options="formats"
            v-model="format"
          />
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          flat
          label="cancel"
          @click="cancel"
        />
        <q-btn
          flat
          label="confirm"
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
      formats: ["Bibtex"],
      format: "Bixtex",
    };
  },

  methods: {
    confirm() {
      this.$emit("confirm");
      this.$emit("update:show", false);
    },

    cancel() {
      // do nothing, only close the dialog
      this.$emit("update:show", false);
    },
  },
};
</script>
