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
        :outline="outline"
        @clickTOC="(node: TOCNode) => clickTOC(node)"
      />
    </q-tab-panel>

    <q-tab-panel name="annotationTab">
      <AnnotationList
        :annots="annots"
        :selectedAnnotId="selectedAnnotId"
      />
    </q-tab-panel>
  </q-tab-panels>
</template>

<script setup lang="ts">
import { inject, ref } from "vue";
import { Annotation, Project, TOCNode } from "src/backend/database";
import {
  KEY_annots,
  KEY_clickTOC,
  KEY_outline,
  KEY_project,
  KEY_selectedAnnotId,
} from "./injectKeys";

import MetaInfoTab from "../MetaInfoTab.vue";
import PDFTOC from "./PDFTOC.vue";
import AnnotationList from "./AnnotationList.vue";

const rightMenuTab = ref("metaInfoTab");

let selectedAnnotId = inject(KEY_selectedAnnotId) as string;
let annots = inject(KEY_annots) as Annotation[];
let outline = inject(KEY_outline) as TOCNode[];
let project = inject(KEY_project) as Project;

const clickTOC = inject(KEY_clickTOC) as (node: TOCNode) => void;
</script>
