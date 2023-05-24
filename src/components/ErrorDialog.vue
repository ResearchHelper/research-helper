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
            :name="error?.name"
            :color="error?.name == 'error' ? 'negative' : 'warning'"
          />
          {{ $t(error?.name || "") }}
        </div>
      </q-card-section>
      <q-card-section
        class="q-pt-none"
        data-cy="error-msg"
      >
        {{ error?.message || "" }}
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          flat
          dense
          :ripple="false"
          label="OK"
          @click="close"
          data-cy="btn-ok"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
<script setup lang="ts">
const props = defineProps({
  show: { type: Boolean, required: true },
  error: { type: Error, required: false },
});
const emit = defineEmits(["update:show"]);

const close = () => {
  emit("update:show", false);
};
</script>
