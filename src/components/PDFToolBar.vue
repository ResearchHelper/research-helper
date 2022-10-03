<template>
  <q-toolbar class="q-px-none">
    <q-btn
      flat
      dense
      icon="account_tree"
      @click="stateStore.toggleLeftMenu"
    >
    </q-btn>
    <q-separator
      dark
      vertical
    />

    <q-tabs
      v-model="currentProjectId"
      @update:model-value="(id) => getProjectById(id)"
      shrink
      v-if="stateStore.openedProjects.length < 3"
    >
      <q-tab
        v-for="(item, i) in stateStore.openedProjects"
        :name="item.projectId"
        :label="item.title"
        :key="i"
        content-class="truncate"
      />
    </q-tabs>
    <q-btn-dropdown v-else>
      <template v-slot:label>
        <div class="truncate">
          {{ stateStore.workingProject.title }}
        </div>
      </template>
      <q-list>
        <q-item
          v-for="(item, i) in stateStore.openedProjects.filter(
            (project) =>
              project.projectId !== stateStore.workingProject.projectId
          )"
          clickable
          v-close-popup
          :key="i"
          @click="stateStore.workingProject = item"
        >
          <q-item-label class="truncate"> {{ item.title }} </q-item-label>
        </q-item>
      </q-list>
    </q-btn-dropdown>

    <q-separator
      dark
      vertical
    />
    <q-space />
    <q-input
      outlined
      dense
      v-model="stateStore.searchString"
      placeholder="Search"
    >
      <template v-slot:append>
        <q-icon
          class="cursor-pointer"
          name="search"
        />
      </template>
    </q-input>

    <q-btn-dropdown
      flat
      dense
      label="View"
    >
      <q-list dense>
        <q-item
          clickable
          v-close-popup
          @click="$emit('changeScaleValue', 'page-width')"
        >
          Page Width
        </q-item>
        <q-item
          clickable
          v-close-popup
          @click="$emit('changeScaleValue', 'page-height')"
        >
          Page Height
        </q-item>
        <q-item>
          <q-btn
            dense
            :ripple="false"
            @click="$emit('changeScale', -0.1)"
          >
            -
          </q-btn>
          <q-btn :ripple="false">100%</q-btn>
          <q-btn
            dense
            :ripple="false"
            @click="$emit('changeScale', 0.1)"
          >
            +
          </q-btn>
        </q-item>
        <q-separator />
        <q-item
          clickable
          v-close-popup
          @click="$emit('changeSpreadMode', 0)"
        >
          No Spread
        </q-item>
        <q-item
          clickable
          v-close-popup
          @click="$emit('changeSpreadMode', 1)"
        >
          Odd Spread
        </q-item>
        <q-item
          clickable
          v-close-popup
          @click="$emit('changeSpreadMode', 2)"
        >
          Even Spread
        </q-item>
      </q-list>
    </q-btn-dropdown>

    <q-btn-dropdown
      flat
      dense
      label="Tool"
    >
      <q-list dense>
        <q-item
          clickable
          v-close-popup
          @click="$emit('changeEditorMode', 'NONE')"
        >
          Cursor
        </q-item>
        <q-item
          clickable
          v-close-popup
          @click="$emit('changeEditorMode', 'HIGHLIGHT')"
        >
          <q-item-section avatar>
            <q-icon name="format_color_fill"></q-icon>
          </q-item-section>
          Hightlight
        </q-item>
        <q-item
          clickable
          v-close-popup
          @click="$emit('changeEditorMode', 'COMMENT')"
        >
          <q-item-section avatar>
            <q-icon name="comment"></q-icon>
          </q-item-section>
          Comment
        </q-item>
        <q-item
          clickable
          v-close-popup
          @click="$emit('changeEditorMode', 'INK')"
        >
          <q-item-section avatar>
            <q-icon name="edit"></q-icon>
          </q-item-section>
          Free Ink
        </q-item>
        <q-item
          clickable
          v-close-popup
          @click="$emit('changeEditorMode', 'FREETEXT')"
        >
          <q-item-section avatar>
            <q-icon name="title"></q-icon>
          </q-item-section>
          Free Text
        </q-item>
      </q-list>
    </q-btn-dropdown>

    <q-btn
      flat
      dense
      icon="list"
      @click="stateStore.toggleInfoPane"
    >
    </q-btn>
  </q-toolbar>
</template>

<script>
import { useStateStore } from "src/stores/appState";

export default {
  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  data() {
    return {
      currentProjectId: this.stateStore.workingProject.projectId,
    };
  },

  methods: {
    getProjectById(id) {
      for (let project of this.stateStore.openedProjects) {
        if (project.projectId === id) this.stateStore.workingProject = project;
      }
    },
  },
};
</script>

<style>
.truncate {
  width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
