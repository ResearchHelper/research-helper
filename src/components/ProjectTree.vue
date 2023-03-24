<template>
  <q-splitter
    style="background: var(--color-projecttree-bkgd)"
    horizontal
    emit-immediately
    :limits="[36, maxHeight]"
    unit="px"
    :separator-class="{
      'q-splitter-separator-horizontal': isGraphViewOpened && isTreeOpened,
      'no-pointer-events': !isGraphViewOpened || !isTreeOpened,
    }"
    v-model="treeSize"
  >
    <template v-slot:before>
      <!-- expansion item title height: 36px -->
      <q-expansion-item
        v-model="isTreeOpened"
        dense
        dense-toggle
        expand-separator
        default-opened
        hide-expand-icon
        header-class="q-pa-none q-ma-none shadow-1"
        header-style="height: 36px"
        :duration="0"
      >
        <template v-slot:header="props">
          <q-item-section
            side
            class="q-pa-none"
          >
            <q-icon
              :name="props.expanded ? 'arrow_drop_down' : 'arrow_right'"
            />
          </q-item-section>
          <q-item-section>
            <div style="font-size: 1rem">{{ $t("active-projects") }}</div>
          </q-item-section>
        </template>
        <div :style="`height: ${treeSize - 36}px; overflow-y: auto`">
          <q-tree
            ref="tree"
            dense
            no-transition
            no-selection-unset
            no-nodes-label="No working projects"
            :nodes="projects"
            node-key="_id"
            selected-color="primary"
            v-model:selected="stateStore.workingItemId"
            v-model:expanded="expanded"
          >
            <template v-slot:default-header="prop">
              <!-- use full-width so that click trailing empty space 
        of the node still fires click event -->
              <!-- only note can drop into a project -->
              <div
                style="width: calc(100% - 23px)"
                class="row"
                @click="selectItem(prop.node)"
              >
                <q-menu
                  touch-position
                  context-menu
                  @before-show="menuSwitch(prop.node)"
                >
                  <!-- menu for project -->
                  <q-list
                    dense
                    v-if="projectMenu"
                  >
                    <q-item
                      clickable
                      v-close-popup
                      @click="addNote(prop.node)"
                    >
                      <q-item-section> {{ $t("add-note") }} </q-item-section>
                    </q-item>
                    <q-separator />
                    <q-item
                      clickable
                      v-close-popup
                      @click="closeProject(prop.key)"
                    >
                      <q-item-section>
                        {{ $t("close-project") }}
                      </q-item-section>
                    </q-item>
                  </q-list>

                  <!-- menu for notes -->
                  <q-list
                    dense
                    v-else
                  >
                    <q-item
                      clickable
                      v-close-popup
                      @click="setRenameNote(prop.node)"
                    >
                      <q-item-section> {{ $t("rename") }} </q-item-section>
                    </q-item>
                    <q-item
                      clickable
                      v-close-popup
                      @click="deleteNote(prop.node)"
                    >
                      <q-item-section> {{ $t("delete") }} </q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>

                <q-icon
                  v-if="prop.node.dataType == 'note'"
                  size="1.2rem"
                  name="bi-file-earmark-text"
                />
                <q-icon
                  v-else
                  size="1.2rem"
                  name="import_contacts"
                />
                <!-- note icon has 1rem width -->
                <input
                  v-if="prop.node == renamingNote"
                  style="width: calc(100% - 1.2rem)"
                  v-model="prop.node.label"
                  @keydown.enter="renameNote"
                  @blur="renameNote"
                  ref="renameInput"
                />
                <!-- add item-id and type for access of drag source -->
                <div
                  v-else
                  style="width: calc(100% - 1.2rem)"
                  class="ellipsis"
                  :item-id="prop.key"
                  :type="prop.node.dataType"
                >
                  {{ prop.node.label }}
                  <q-tooltip> ID: {{ prop.key }} </q-tooltip>
                </div>
              </div>
              <q-icon
                v-if="prop.node.dataType == 'project'"
                name="close"
                @click="closeProject(prop.key)"
              >
                <q-tooltip> {{ $t("close-project") }} </q-tooltip>
              </q-icon>
            </template>
          </q-tree>
        </div>
      </q-expansion-item>
    </template>

    <template v-slot:after>
      <q-expansion-item
        v-model="isGraphViewOpened"
        dense
        dense-toggle
        switch-toggle-side
        expand-separator
        hide-expand-icon
        header-class="q-pa-none q-ma-none shadow-1"
        :duration="0"
      >
        <template v-slot:header="props">
          <q-item-section
            side
            class="q-pa-none"
          >
            <q-icon
              :name="props.expanded ? 'arrow_drop_down' : 'arrow_right'"
            />
          </q-item-section>
          <q-item-section>
            <div style="font-size: 1rem">{{ $t("related-items") }}</div>
          </q-item-section>
          <q-item-section side>
            <q-btn
              flat
              :ripple="false"
              size="sm"
              padding="none"
              class="q-mr-xs"
              icon="refresh"
              @click.stop="$refs.graphview.reload()"
            >
              <q-tooltip>{{ $t("refresh-graphview") }}</q-tooltip>
            </q-btn>
          </q-item-section>
        </template>
        <GraphView
          v-if="isGraphViewOpened"
          :itemId="stateStore.workingItemId"
          :height="treeSize"
          ref="graphview"
        />
      </q-expansion-item>
    </template>
  </q-splitter>
</template>

<script>
import GraphView from "./GraphView.vue";

import { useStateStore } from "src/stores/appState";
import {
  getNotes,
  addNote,
  deleteNote,
  updateNote,
} from "src/backend/project/note";
import { sortTree } from "src/backend/project/utils";
import { getProject } from "src/backend/project/project";
import {
  createEdge,
  deleteEdge,
  updateEdge,
  appendEdgeTarget,
  deleteEdgeTarget,
  updateEdgeTarget,
} from "src/backend/project/graph";

export default {
  emits: ["addNode", "renameNode", "closeProject", "openProject"],

  components: { GraphView },

  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  data() {
    return {
      maxHeight: 36,
      maxWidth: 0,
      treeSize: 36,
      isTreeOpened: true,

      // tree
      projects: [],
      expanded: [],
      prvExpanded: [],
      renamingNote: null,

      // graphview
      loadingGraph: true,
      isGraphViewOpened: false,

      // drag and drop
      draggingNode: null,
      dragoverNode: null,
    };
  },

  async mounted() {
    this.maxWidth = this.$el.offsetWidth;
    this.maxHeight = this.$el.offsetHeight - 36;
    this.treeSize = this.maxHeight;

    // events emited from other components (TableView.vuew)
    this.$bus.on("updateProject", this.updateProject);
    this.$bus.on("deleteProject", this.closeProject);

    await this.getProjectTree();
    let selected = this.stateStore.workingItemId;
    let selectedNode = this.$refs.tree.getNodeByKey(selected);
    if (!!selectedNode && selectedNode?.children?.length > 0)
      this.expanded.push(selected);
  },

  beforeUnmount() {
    // not necessary for this component, but a good habit
    this.$bus.off("updateProject", this.updateProject);
    this.$bus.off("deleteProject", this.closeProject);
  },

  watch: {
    async "stateStore.openItemId"(id) {
      if (!!!id) return;
      let node = this.$refs.tree.getNodeByKey(id);
      if (!!node) return; // if project is active already, return

      let item = await getProject(id);
      if (item?.dataType == "project") {
        this.stateStore.openedProjectIds.add(id);
        this.pushProjectNode(id);
      } else if (item?.dataType == "note") {
        this.stateStore.openedProjectIds.add(item.projectId);
        this.pushProjectNode(item.projectId);
      }
    },

    isTreeOpened(opened) {
      if (!opened) this.treeSize = 36;
      else if (opened && !this.isTreeOpened) this.treeSize = this.maxHeight;
      else this.treeSize = this.maxHeight / 2;
    },

    isGraphViewOpened(opened) {
      if (this.isTreeOpened) {
        if (opened) this.treeSize = this.maxHeight / 2;
        else this.treeSize = this.maxHeight;
      }
    },

    "$q.screen.height"(_) {
      this.maxHeight = this.$el.offsetHeight - 36;
      if (!this.isGraphViewOpened) this.treeSize = this.maxHeight;
    },
  },

  methods: {
    menuSwitch(node) {
      if (node.dataType == "note") {
        // show context menu for notes
        this.projectMenu = false;
      } else {
        // show context menu for project
        this.projectMenu = true;
      }
    },

    async getProjectTree() {
      this.projects = [];
      for (let projectId of this.stateStore.openedProjectIds) {
        await this.pushProjectNode(projectId);
      }

      // sort notes in each project
      for (let i in this.projects) {
        sortTree(this.projects[i]);
      }
    },

    async pushProjectNode(projectId) {
      let project = await getProject(projectId);
      let notes = await getNotes(projectId);
      this.projects.push({
        _id: project._id,
        dataType: project.dataType,
        label: project.title,
        children: notes,
        path: project.path,
      });
      this.expanded.push(projectId);

      await this.$nextTick(); // wait until ui updates
      let element = this.$refs.tree.$el.querySelector(
        `[item-id='${projectId}']`
      );
      this.$emit("addNode", element);

      for (let note of notes) {
        this.$emit(
          "addNode",
          this.$refs.tree.$el.querySelector(`[item-id='${note._id}']`)
        );
      }
    },

    /**
     * Receive updated project from other component and update the projectTree
     * @param {Object} project
     */
    updateProject(project) {
      let idx = this.projects.findIndex((p) => p._id == project._id);
      // when updating project, be careful whether children property is undefined
      // the updateProject event emit from PDFReader has no children property
      this.projects[idx] = {
        _id: project._id,
        dataType: project.dataType,
        label: project.title,
        children: project.children || this.projects[idx].children,
        path: project.path,
      };
    },

    selectItem(node) {
      console.log(node);
      this.stateStore.workingItemId = node._id;
      if (node.children?.length > 0) this.expanded.push(node._id);

      this.$emit("openProject", node._id);
    },

    async closeProject(projectId) {
      this.$emit("closeProject", projectId);

      let selected = this.stateStore.workingItemId;
      if (this.stateStore.workingItemId == projectId) {
        selected = this.stateStore.openedProjectIds.has(projectId)
          ? projectId
          : "library";
      }
      this.stateStore.openedProjectIds.delete(projectId);
      this.projects = this.projects.filter((p) => p._id != projectId);

      setTimeout(() => {
        this.stateStore.workingItemId = selected;
      }, 50);
    },

    async addNote(node) {
      // update db
      let note = await addNote(node._id);
      await createEdge(note);
      await appendEdgeTarget(note.projectId, note);

      // update ui
      node.children.push(note);

      await this.$nextTick(); // wait until ui updates
      this.setRenameNote(note);
    },

    async deleteNote(node) {
      // update db
      await deleteNote(node._id);
      await deleteEdge(node._id); // delete edge of note
      await deleteEdgeTarget(node.projectId, node._id); // delete target from project's edge

      // update ui
      let index = this.projects.findIndex((p) => p.children.indexOf(node) > -1);
      let project = this.projects[index];

      project.children = project.children.filter(
        (child) => child._id != node._id
      );
      if (project.children.length == 0) {
        this.selectItem(project);
      } else {
        this.selectItem(project.children[0]);
      }
    },

    setRenameNote(node) {
      // set renaming note and show input
      this.renamingNote = node;

      setTimeout(() => {
        // wait till input appears
        // focus onto the input and select the text
        let input = this.$refs.renameInput;
        input.focus();
        input.select();
      }, 100);
    },

    async renameNote() {
      let renamingNote = this.renamingNote;
      if (!!!renamingNote) return;
      // update db
      await updateNote(renamingNote._id, { label: renamingNote.label });
      let sourceNode = {
        id: renamingNote._id,
        label: renamingNote.label,
        type: renamingNote.dataType,
      };
      await updateEdge(renamingNote._id, { sourceNode, sourceNode });
      await updateEdgeTarget(renamingNote.projectId, renamingNote);

      // update ui
      this.renamingNote = null;
      let projectNode = this.$refs.tree.getNodeByKey(renamingNote.projectId);
      sortTree(projectNode); // sort notes

      await this.$nextTick();
      this.$emit(
        "renameNode",
        this.$refs.tree.$el.querySelector(`[item-id='${renamingNote._id}']`)
      );
    },
  },
};
</script>
<style>
.q-splitter__panel {
  overflow: hidden;
}
</style>
