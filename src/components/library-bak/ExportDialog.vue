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
          />

          <q-select
            v-if="format.value === 'bibliography'"
            outlined
            dense
            options-dense
            :options="templates"
            v-model="template"
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
<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: { show: Boolean },
  emits: ["update:show", "confirm"],

  data() {
    return {
      formats: [
        { label: "Bibliography", value: "bibliography" },
        { label: "BibTeX", value: "bibtex" },
        { label: "BibLaTex", value: "biblatex" },
        { label: "CLS-JSON", value: "json" },
        { label: "RIS", value: "ris" },
      ],
      format: { label: "BibTeX", value: "bibtex" },

      templates: [
        { label: "APA", value: "apa" },
        { label: "Vancouver", value: "vancouver" },
        { label: "Havard1", value: "havard1" },
      ],
      template: { label: "APA", value: "apa" },
    };
  },

  methods: {
    confirm() {
      let options = null;
      if (this.format.value === "bibliography")
        options = { template: this.template.value };
      this.$emit("confirm", this.format.value, options);
      this.$emit("update:show", false);
    },

    cancel() {
      // do nothing, only close the dialog
      this.$emit("update:show", false);
    },
  },
});
</script>
