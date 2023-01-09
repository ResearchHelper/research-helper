<template>
  <!-- systembar: 32px, tab: 36px  -->
  <!-- show this after rightMenu is shown, 
    otherwise autogrow extends to full-height -->
  <div v-if="!!project">
    <q-input
      borderless
      autogrow
      dense
      label="Type"
      v-model="project.type"
      @blur="modifyInfo()"
    />
    <q-input
      borderless
      autogrow
      dense
      label="Title"
      v-model="project.title"
      @blur="modifyInfo()"
    />
    <q-input
      borderless
      autogrow
      dense
      label="Author(s)"
      v-model="author"
      @blur="modifyInfo()"
    />
    <q-input
      borderless
      dense
      type="textarea"
      label="Abstract"
      v-model="project.abstract"
      @blur="modifyInfo()"
    />
    <q-input
      borderless
      autogrow
      dense
      label="DOI"
      v-model="project.DOI"
      @blur="modifyInfo()"
    />
    <q-input
      borderless
      autogrow
      dense
      label="ISBN"
      v-model="project.isbn"
      @blur="modifyInfo()"
    />

    <q-input
      borderless
      autogrow
      dense
      label="File"
      v-model="project.path"
      @blur="modifyInfo()"
    />

    <div class="column">
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
  </div>
</template>

<script>
import { useStateStore } from "src/stores/appState";
import { getProject, updateProject } from "src/backend/project/project";

export default {
  props: { projectId: String },
  emits: ["updateProject"],

  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  data() {
    return {
      project: null,
      tag: "",
      relatedProjects: [],
      relatedProjectId: "",
    };
  },

  computed: {
    author: {
      get() {
        let authors = this.project.author;
        if (!!!authors?.length) return "";

        let names = [];
        for (let author of authors) {
          if (!!!author) continue;
          if (!!author.literal) names.push(author.literal);
          else names.push(`${author.given} ${author.family}`);
        }
        return names.join("\n");
      },
      set(text) {
        this.project.author = [];
        let names = text.split("\n");
        for (let i in names) {
          let name = names[i];
          if (name.trim() === "") continue;

          let author = {};
          if (name.includes(",")) {
            [author.family, author.given] = name
              .split(",")
              .map((item) => item.trim());
          } else {
            let truncks = name.split(" ");
            if (truncks.length === 1) {
              author.literal = name;
            } else {
              author.family = truncks.pop();
              author.given = truncks.join("");
            }
          }
          this.project.author[i] = author;
        }
      },
    },
  },

  mounted() {
    this.getInfo(this.projectId);
  },

  watch: {
    projectId(id) {
      this.getInfo(id);
    },
  },

  methods: {
    async getInfo(projectId) {
      if (!!!projectId) return;
      this.project = await getProject(projectId);
      await this.getRelatedProjects(this.project.related);
    },

    async getRelatedProjects(related) {
      this.relatedProjects = [];
      for (let projectId of related) {
        this.relatedProjects.push(await getProject(projectId));
      }
    },

    async modifyInfo() {
      // update db and also update rev in this.project
      this.project = await updateProject(this.project);

      // update table data
      this.$emit("updateProject", this.project);
    },

    async addTag() {
      // update ui
      this.project.tags.push(this.tag);
      this.tag = ""; // remove text in input

      // update table data
      this.$emit("updateProject", this.project);

      // update db
      this.project = await updateProject(this.project);
    },

    async removeTag(tag) {
      // update ui
      this.project.tags = this.project.tags.filter((t) => t != tag);

      // update table data
      this.$emit("updateProject", this.project);

      // update db
      this.project = await updateProject(this.project);
    },

    async addRelated() {
      // update related of current project
      this.project.related.push(this.relatedProjectId);
      this.project = await updateProject(this.project);

      // update related of the related project
      let relatedProject = await getProject(this.relatedProjectId);
      relatedProject.related.push(this.project._id);
      relatedProject = await updateProject(relatedProject);

      this.relatedProjectId = "";
      await this.getRelatedProjects(this.project.related);
    },

    async removeRelated(relatedProject) {
      this.project.related = this.project.related.filter(
        (id) => id != relatedProject._id
      );
      this.project = await updateProject(this.project);

      relatedProject = await getProject(relatedProject._id);
      relatedProject.related = relatedProject.related.filter(
        (id) => id != this.project._id
      );
      relatedProject = await updateProject(relatedProject);

      await this.getRelatedProjects(this.project.related);
    },

    clickRelated(project) {
      if (this.stateStore.workingItemId == "library") {
        // in case the related projects are not in the same folder
        // switch to library folder first
        this.stateStore.selectedFolderId = "library";
        this.stateStore.selectedProjectId = project._id;
      } else {
        this.stateStore.openItemId = project._id;
      }
    },
  },
};
</script>
