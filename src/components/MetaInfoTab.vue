<template>
  <!-- systembar: 32px, tab: 36px  -->
  <!-- show this after infoPane is shown, 
    otherwise autogrow extends to full-height -->
  <q-scroll-area
    v-if="!!stateStore.infoPaneSize"
    style="height: calc(100vh - 68px)"
    class="q-mx-sm"
  >
    <q-input
      borderless
      autogrow
      dense
      label="Title"
      v-model="stateStore.selectedProject.title"
      @blur="modifyInfo"
    />
    <q-input
      borderless
      autogrow
      dense
      label="Author(s)"
      v-model="stateStore.selectedProject.author"
      @blur="modifyInfo"
    />
    <q-input
      borderless
      dense
      type="textarea"
      label="Abstract"
      v-model="stateStore.selectedProject.abstract"
      @blur="modifyInfo"
    />
    <q-input
      borderless
      autogrow
      dense
      label="ArxivID"
      v-model="stateStore.selectedProject.arxiv_id"
    />
    <q-input
      borderless
      autogrow
      dense
      label="DOI"
      v-model="stateStore.selectedProject.doi"
    />
    <q-input
      borderless
      autogrow
      dense
      label="ISBN"
      v-model="stateStore.selectedProject.isbn"
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
        v-for="(tag, index) in stateStore.selectedProject.tags"
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
      @keydown.enter="addRelated"
    />
    <div
      style="max-width: 200px"
      class="column"
    >
      <q-chip
        v-for="(project, index) in this.relatedProjects"
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
import { getProject, updateProject } from "src/api/project/projectInfo";

export default {
  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  data() {
    return {
      tag: "",
      relatedProjects: [],
      relatedProjectId: "",
    };
  },

  watch: {
    "stateStore.selectedProject._id"(projectId, _) {
      this.getProjectInfo();
    },
  },

  mounted() {
    this.getProjectInfo();
  },

  methods: {
    modifyInfo() {
      updateProject(this.stateStore.selectedProject);
    },

    addTag() {
      // update ui
      this.stateStore.selectedProject.tags.push(this.tag);
      this.tag = "";

      // update db
      updateProject(this.stateStore.selectedProject);
    },

    removeTag(tag) {
      let project = this.stateStore.selectedProject;
      project.tags = project.tags.filter((t) => t != tag);

      updateProject(project);
    },

    async getProjectInfo() {
      // fetch the project from db to ensure latest related project
      // we have to do this because the row in tableview didn't changed
      let project = await getProject(this.stateStore.selectedProject._id);
      this.stateStore.selectedProject.related = project.related;

      // get related projects
      let projectIds = this.stateStore.selectedProject.related;
      this.relatedProjects = [];
      for (let projectId of projectIds) {
        let relatedProject = await getProject(projectId);
        this.relatedProjects.push(relatedProject);
      }
    },

    async addRelated() {
      // update db
      this.stateStore.selectedProject.related.push(this.relatedProjectId);
      await updateProject(this.stateStore.selectedProject);

      let relatedProject = await getProject(this.relatedProjectId);
      relatedProject.related.push(this.stateStore.selectedProject._id);
      await updateProject(relatedProject);

      // update ui
      this.relatedProjectId = "";
      this.relatedProjects.push(relatedProject);
    },

    async removeRelated(relatedProject) {
      let project = this.stateStore.selectedProject;
      // update db
      project.related = project.related.filter(
        (id) => id != relatedProject._id
      );
      await updateProject(project);

      relatedProject.related = relatedProject.related.filter(
        (id) => id != project._id
      );
      await updateProject(relatedProject);

      // update ui
      this.relatedProjects = this.relatedProjects.filter(
        (rp) => rp._id != relatedProject._id
      );
    },

    clickRelated(project) {
      // in case the related projects are not in the same folder
      // switch to library folder first
      this.stateStore.selectedFolderId = "library";
      this.stateStore.selectedProject = project;
    },
  },
};
</script>
