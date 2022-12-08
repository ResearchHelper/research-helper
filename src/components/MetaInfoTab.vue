<template>
  <!-- systembar: 32px, tab: 36px  -->
  <!-- show this after infoPane is shown, 
    otherwise autogrow extends to full-height -->
  <q-scroll-area
    v-if="!!stateStore.infoPaneSize && !!projectStore.selectedProject"
    style="height: calc(100vh - 68px)"
    class="q-mx-sm"
  >
    <q-input
      borderless
      autogrow
      dense
      label="Title"
      v-model="projectStore.selectedProject.title"
      @blur="modifyInfo('title')"
    />
    <q-input
      borderless
      autogrow
      dense
      label="Author(s)"
      v-model="projectStore.selectedProject.author"
      @blur="modifyInfo('author')"
    />
    <q-input
      borderless
      dense
      type="textarea"
      label="Abstract"
      v-model="projectStore.selectedProject.abstract"
      @blur="modifyInfo('abstract')"
    />
    <q-input
      borderless
      autogrow
      dense
      label="ArxivID"
      v-model="projectStore.selectedProject.arxiv_id"
    />
    <q-input
      borderless
      autogrow
      dense
      label="DOI"
      v-model="projectStore.selectedProject.doi"
    />
    <q-input
      borderless
      autogrow
      dense
      label="ISBN"
      v-model="projectStore.selectedProject.isbn"
    />
    <q-input
      borderless
      dense
      label="Tags"
      v-model.trim="tag"
      @keydown.enter="addTag"
    />
    <div class="column">
      <q-chip
        v-for="(tag, index) in projectStore.selectedProject.tags"
        :key="index"
        :ripple="false"
        dense
        icon="bookmark"
        removable
        @remove="removeTag(tag)"
      >
        {{ tag }}
      </q-chip>
    </div>
    <q-input
      borderless
      dense
      label="Related"
      v-model.trim="relatedProjectId"
      placeholder="projectID"
      @keydown.enter="addRelated"
    />
    <div
      style="max-width: 200px"
      class="column"
    >
      <q-chip
        v-for="(project, index) in relatedProjects"
        :key="index"
        :ripple="false"
        dense
        icon="article"
        :label="project.title"
        clickable
        removable
        @remove="removeRelated(project)"
        @click="clickRelated(project)"
      />
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
      tag: "",
      relatedProjects: [],
      relatedProjectId: "",
    };
  },

  mounted() {
    console.log("mounted");
  },

  watch: {
    "projectStore.selectedProject._id"(projectId, _) {
      this.projectStore.getRelatedProjects().then((projects) => {
        this.relatedProjects = projects;
      });
    },
  },

  methods: {
    modifyInfo(prop) {
      let project = this.projectStore.selectedProject;
      this.projectStore.update(project._id, { prop: project[prop] });
    },

    async addTag() {
      let project = this.projectStore.selectedProject;
      project.tags.push(this.tag);
      this.projectStore.update(project._id, { tags: project.tags });

      // remove texts in input
      this.tag = "";
    },

    async removeTag(tag) {
      let project = this.projectStore.selectedProject;
      project.tags = project.tags.filter((t) => t != tag);
      this.projectStore.update(project._id, { tags: project.tags });
    },

    async addRelated() {
      let project = this.projectStore.selectedProject;
      project.related.push(this.relatedProjectId);
      this.projectStore.update(project._id, { related: project.related });

      let relatedProject = await this.projectStore.get(this.relatedProjectId);
      relatedProject.related.push(project._id);
      this.projectStore.update(this.relatedProjectId, {
        related: relatedProject.related,
      });

      this.relatedProjectId = "";
      this.relatedProjects = await this.projectStore.getRelatedProjects();
    },

    async removeRelated(relatedProject) {
      let project = this.projectStore.selectedProject;
      project.related = project.related.filter(
        (id) => id != relatedProject._id
      );
      await this.projectStore.update(project._id, { related: project.related });

      relatedProject = await this.projectStore.get(relatedProject._id);
      relatedProject.related = relatedProject.related.filter(
        (id) => id != project._id
      );
      await this.projectStore.update(relatedProject._id, {
        related: relatedProject.related,
      });

      this.relatedProjects = await this.projectStore.getRelatedProjects();
    },

    clickRelated(project) {
      // in case the related projects are not in the same folder
      // switch to library folder first
      this.stateStore.selectedFolderId = "library";
      this.projectStore.selectedProject = project;
    },
  },
};
</script>
