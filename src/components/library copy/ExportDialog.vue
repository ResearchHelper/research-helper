<template>
  <q-dialog
    :model-value="show"
    @hide="cancel"
  >
    <q-card style="min-width: 300px">
      <q-card-section>
        <div class="text-h6">{{ $t("options") }}</div>
      </q-card-section>
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
            data-cy="format-select"
          />

          <q-select
            v-if="format.value === 'bibliography'"
            outlined
            dense
            options-dense
            :options="templates"
            v-model="template"
            data-cy="template-select"
          />
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          flat
          square
          label="cancel"
          @click="cancel"
          data-cy="btn-cancel"
        />
        <q-btn
          flat
          square
          label="confirm"
          @click="confirm"
          data-cy="btn-confirm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
<script setup lang="ts">
import { ref } from "vue";

const props = defineProps({ show: { type: Boolean, required: true } });
const emit = defineEmits(["update:show", "confirm"]);

const formats = ref([
  { label: "Bibliography", value: "bibliography" },
  { label: "BibTeX", value: "bibtex" },
  { label: "BibLaTeX", value: "biblatex" },
  { label: "CLS-JSON", value: "json" },
  { label: "RIS", value: "ris" },
]);
const format = ref({ label: "BibTeX", value: "bibtex" });
const templates = ref([
  { label: "APA", value: "apa" },
  { label: "Vancouver", value: "vancouver" },
  { label: "Havard1", value: "havard1" },
]);
const template = ref({ label: "APA", value: "apa" });

function confirm() {
  let options = null;
  if (format.value.value === "bibliography")
    options = { template: template.value.value };
  emit("confirm", format.value.value, options);
  emit("update:show", false);
}

function cancel() {
  // do nothing, only close the dialog
  emit("update:show", false);
}
</script>
