<template>
  <!-- systembar: 32px, tab: 36px  -->
  <!-- show this after rightMenu is shown, 
    otherwise autogrow extends to full-height -->
  <div v-if="!!project">
    <div style="font-size: 1.2rem">Type</div>
    <q-input
      borderless
      autogrow
      dense
      input-style="font-size: 1rem; padding-top: 0"
      v-model="project.type"
      @blur="modifyInfo()"
    />
    <q-separator />
    <div style="font-size: 1.2rem">Title</div>
    <q-input
      borderless
      autogrow
      dense
      input-style="font-size: 1rem; padding-top: 0"
      v-model="project.title"
      @blur="modifyInfo()"
    />
    <q-separator />
    <div style="font-size: 1.2rem">Author(s)</div>
    <q-input
      borderless
      autogrow
      dense
      input-style="font-size: 1rem; padding-top: 0"
      v-model="author"
      @blur="modifyInfo()"
    />
    <q-separator />
    <div style="font-size: 1.2rem">Abstract</div>
    <q-input
      borderless
      dense
      type="textarea"
      input-style="font-size: 1rem; padding-top: 0"
      v-model="project.abstract"
      @blur="modifyInfo()"
    />
    <q-separator />
    <div style="font-size: 1.2rem">DOI</div>
    <q-input
      borderless
      autogrow
      dense
      input-style="font-size: 1rem; padding-top: 0"
      v-model="project.DOI"
      @blur="modifyInfo()"
    />
    <q-separator />
    <div style="font-size: 1.2rem">ISBN</div>
    <q-input
      borderless
      autogrow
      dense
      input-style="font-size: 1rem; padding-top: 0"
      v-model="project.isbn"
      @blur="modifyInfo()"
    />
    <q-separator />
    <div style="font-size: 1.2rem">Attached File</div>
    <q-input
      borderless
      autogrow
      dense
      input-style="font-size: 1rem; padding-top: 0"
      v-model="project.path"
      @blur="modifyInfo()"
    />
    <q-separator />
    <div style="font-size: 1.2rem">Tags</div>
    <div class="column">
      <q-input
        borderless
        dense
        input-style="font-size: 1rem; padding-top: 0"
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
    </div>
  </div>
</template>

<script>
import { useStateStore } from "src/stores/appState";
import { getProject, updateProject } from "src/backend/project/project";
import { updateEdge } from "src/backend/project/graph";

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
      this.project = null;
      if (!!!projectId) return;
      let item = await getProject(projectId);
      if (item.dataType !== "project") return;
      this.project = item;
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
      let sourceNode = {
        id: this.project._id,
        label: this.project.title,
        type: "project",
      };
      await updateEdge(this.project._id, { sourceNode: sourceNode });

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
  },
};
</script>
