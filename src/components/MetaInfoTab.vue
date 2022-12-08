<template>
  <!-- systembar: 32px, tab: 36px  -->
  <!-- show this after rightMenu is shown, 
    otherwise autogrow extends to full-height -->
  <q-scroll-area
    v-if="!!stateStore.rightMenuSize && !!project"
    style="height: calc(100vh - 68px)"
    class="q-mx-sm"
  >
    <q-input
      borderless
      autogrow
      dense
      label="Title"
      v-model="project.title"
      @blur="modifyInfo('title')"
    />
    <q-input
      borderless
      autogrow
      dense
      label="Author(s)"
      v-model="project.author"
      @blur="modifyInfo('author')"
    />
    <q-input
      borderless
      dense
      type="textarea"
      label="Abstract"
      v-model="project.abstract"
      @blur="modifyInfo('abstract')"
    />
    <q-input
      borderless
      autogrow
      dense
      label="ArxivID"
      v-model="project.arxiv_id"
    />
    <q-input
      borderless
      autogrow
      dense
      label="DOI"
      v-model="project.doi"
    />
    <q-input
      borderless
      autogrow
      dense
      label="ISBN"
      v-model="project.isbn"
    />
    <div
      style="position: absolute; width: 98%"
      class="column"
    >
      <q-input
        borderless
        dense
        label="Tags"
        v-model.trim="tag"
        @keydown.enter="addTag"
      />
      <q-chip
        v-for="(tag, index) in project.tags"
        :key="index"
        :ripple="false"
        dense
        icon="bookmark"
        :label="tag"
        removable
        @remove="removeTag(tag)"
      >
      </q-chip>

      <q-input
        borderless
        dense
        label="Related"
        v-model.trim="relatedProjectId"
        placeholder="projectID"
        @keydown.enter="addRelated"
      />
      <q-chip
        v-for="(project, index) in relatedProjects"
        :key="index"
        :ripple="false"
        dense
        :label="project.title"
        icon="article"
        clickable
        removable
        @remove="removeRelated(project)"
        @click="clickRelated(project)"
      >
      </q-chip>
    </div>
  </q-scroll-area>
</template>

<script>
import { useStateStore } from "src/stores/appState";
import { useProjectStore } from "src/stores/projectStore";

export default {
  setup() {
    const stateStore = useStateStore();
    const projectStore = useProjectStore();
    return { stateStore, projectStore };
  },

  data() {
    return {
      project: null,
      tag: "",
      relatedProjects: [],
      relatedProjectId: "",
    };
  },

  mounted() {
    let projectId = "";
    if (this.stateStore.currentPage == "library") {
      if (!!!this.projectStore.selectedProject) return;
      projectId = this.projectStore.selectedProject._id;
    } else if (this.stateStore.currentPage == "reader") {
      projectId = this.projectStore.workingProject._id;
    }

    this.getInfo(projectId);
  },

  watch: {
    "projectStore.selectedProject._id"(projectId, _) {
      this.getInfo(projectId);
    },
  },

  methods: {
    async getInfo(projectId) {
      this.project = await this.projectStore.get(projectId);
      this.relatedProjects = await this.projectStore.getRelatedProjects(
        this.project.related
      );
    },

    async modifyInfo(prop) {
      // use [prop] to set variable key
      await this.projectStore.update(this.project._id, {
        [prop]: this.project[prop],
      });
    },

    async addTag() {
      this.project.tags.push(this.tag);
      await this.projectStore.update(this.project._id, {
        tags: this.project.tags,
      });

      // remove texts in input
      this.tag = "";
    },

    async removeTag(tag) {
      this.project.tags = this.project.tags.filter((t) => t != tag);
      await this.projectStore.update(this.project._id, {
        tags: this.project.tags,
      });
    },

    async addRelated() {
      // update related of current project
      this.project.related.push(this.relatedProjectId);
      this.projectStore.update(this.project._id, {
        related: this.project.related,
      });

      // update related of the related project
      let relatedProject = await this.projectStore.get(this.relatedProjectId);
      relatedProject.related.push(this.project._id);
      this.projectStore.update(this.relatedProjectId, {
        related: relatedProject.related,
      });

      this.relatedProjectId = "";
      this.relatedProjects = await this.projectStore.getRelatedProjects(
        this.project.related
      );
    },

    async removeRelated(relatedProject) {
      this.project.related = this.project.related.filter(
        (id) => id != relatedProject._id
      );
      await this.projectStore.update(this.project._id, {
        related: this.project.related,
      });

      relatedProject = await this.projectStore.get(relatedProject._id);
      relatedProject.related = relatedProject.related.filter(
        (id) => id != this.project._id
      );
      await this.projectStore.update(relatedProject._id, {
        related: relatedProject.related,
      });

      this.relatedProjects = await this.projectStore.getRelatedProjects(
        this.project.related
      );
    },

    clickRelated(project) {
      // in case the related projects are not in the same folder
      // switch to library folder first
      if (this.stateStore.currentPage != "library") {
        this.stateStore.setCurrentPage("library");
      }
      this.stateStore.selectedFolderId = "library";
      this.projectStore.selectedProject = project;
    },
  },
};
</script>
