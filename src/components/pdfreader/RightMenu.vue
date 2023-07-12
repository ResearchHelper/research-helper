<template>
  <q-tabs
    v-model="rightMenuTab"
    dense
    align="justify"
    style="background: var(--color-rightmenu-tabs-bkgd)"
    indicator-color="transparent"
    active-color="primary"
  >
    <q-tab
      name="metaInfoTab"
      icon="info"
      :ripple="false"
    >
      <q-tooltip>{{ $t("info") }}</q-tooltip>
    </q-tab>
    <q-tab
      name="tocTab"
      icon="toc"
      :ripple="false"
    >
      <q-tooltip>{{ $t("toc") }}</q-tooltip>
    </q-tab>
    <q-tab
      name="annotationTab"
      icon="edit"
      :ripple="false"
    >
      <q-tooltip>{{ $t("comment") }}</q-tooltip>
    </q-tab>
  </q-tabs>
  <!-- q-tab height: 36px -->
  <q-tab-panels
    style="
      height: calc(100% - 36px);
      background: var(--color-rightmenu-tab-panel-bkgd);
    "
    v-model="rightMenuTab"
  >
    <q-tab-panel name="metaInfoTab">
      <MetaInfoTab v-model:project="project" />
    </q-tab-panel>

    <q-tab-panel name="tocTab">
      <PDFTOC
        :outline="pdfApp.outline"
        @clickTOC="(node: TOCNode) => pdfApp.clickTOC(node)"
      />
    </q-tab-panel>

    <q-tab-panel name="annotationTab">
      <AnnotationList />
    </q-tab-panel>
  </q-tab-panels>
</template>

<script setup lang="ts">
import { inject, Ref, ref } from "vue";
import { Project, TOCNode } from "src/backend/database";
import { KEY_project } from "./injectKeys";

import MetaInfoTab from "../MetaInfoTab.vue";
import PDFTOC from "./PDFTOC.vue";
import AnnotationList from "./AnnotationList.vue";
import { PDFApplication } from "src/backend/pdfreader";

const rightMenuTab = ref("metaInfoTab");

const pdfApp = inject("pdfApp") as PDFApplication;
const project = inject(KEY_project) as Ref<Project>;
</script>
