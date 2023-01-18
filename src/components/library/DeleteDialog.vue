<template>
  <q-dialog
    :model-value="show"
    persistent
    no-shake
    @hide="cancel"
  >
    <q-card>
      <q-card-section>
        <div
          v-if="deleteFromDB"
          class="text-h6"
        >
          Permenantly Delete
        </div>
        <div
          v-else
          class="text-h6"
        >
          Delete
        </div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <strong>
          Are you sure you want to delete the following project ?
        </strong>
        <ul>
          <li>"{{ projectTitle }}"</li>
        </ul>
        <strong v-if="deleteFromDB">
          <div>* This operation is not reversible.</div>
          <div>* Notes in this project will be deleted.</div>
        </strong>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          flat
          v-close-popup
          :ripple="false"
          @click="cancel"
        >
          Cancel
        </q-btn>
        <q-btn
          flat
          v-close-popup
          :ripple="false"
          @click="confirm"
          >Confirm</q-btn
        >
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
<script>
export default {
  props: { show: Boolean, projectTitle: String, deleteFromDB: Boolean },
  emits: ["update:show", "confirm"],

  methods: {
    confirm() {
      let deleteFromDB = true;
      this.$emit("confirm", deleteFromDB);
      this.$emit("update:show", false);
    },

    cancel() {
      // do nothing, only close the dialog
      this.$emit("update:show", false);
    },
  },
};
</script>
