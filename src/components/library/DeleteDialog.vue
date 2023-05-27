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
          {{ $t("permenantly-delete") }}
        </div>
        <div
          v-else
          class="text-h6"
        >
          {{ $t("delete") }}
        </div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <strong>
          {{ $t("are-you-sure-you-want-to-delete-the-following-project") }}
        </strong>
        <ul>
          <li v-for="project in projects">"{{ project.title }}"</li>
        </ul>
        <strong v-if="deleteFromDB">
          <div>{{ $t("this-operation-is-not-reversible") }}</div>
          <div>{{ $t("notes-in-this-project-will-be-deleted") }}</div>
        </strong>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          flat
          square
          v-close-popup
          :ripple="false"
          @click="cancel"
          data-cy="btn-cancel"
        >
          {{ $t("cancel") }}
        </q-btn>
        <q-btn
          flat
          square
          v-close-popup
          :ripple="false"
          @click="confirm"
          color="negative"
          data-cy="btn-confirm"
        >
          {{ $t("confirm") }}
        </q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
<script setup lang="ts">
import { PropType } from "vue";
import { Project } from "src/backend/database";
const props = defineProps({
  show: { type: Boolean, required: true },
  projects: { type: Object as PropType<Project[]>, required: false },
  deleteFromDB: { type: Boolean, required: true },
});
const emit = defineEmits(["update:show", "confirm"]);

function confirm() {
  emit("confirm");
  emit("update:show", false);
}

function cancel() {
  // do nothing, only close the dialog
  emit("update:show", false);
}
</script>
