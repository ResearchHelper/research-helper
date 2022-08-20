<template>
  <q-toolbar dense>
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
      v-model="stateStore.workingProject"
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
    ></q-btn-dropdown>
    <q-btn-dropdown
      flat
      dense
      label="Tool"
    ></q-btn-dropdown>
    <q-separator
      dark
      vertical
    />
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

  methods: {
    switchProject(params) {
      console.log(params);
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
