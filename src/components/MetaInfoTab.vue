<template>
  <!-- tab: 36px  -->
  <!-- show this after rightMenu is shown, 
    otherwise autogrow extends to full-height -->
  <div v-if="!!project">
    <div class="row justify-between">
      <div
        class="col"
        style="font-size: 1rem"
      >
        Type
      </div>
      <input
        class="col-8 input"
        type="text"
        v-model="project.type"
        @blur="modifyInfo(true)"
      />
    </div>

    <div class="row q-mt-sm">
      <div
        class="col"
        style="font-size: 1rem"
      >
        Title
      </div>
    </div>

    <div class="row q-mt-sm">
      <textarea
        style="min-height: 5rem"
        class="col input"
        type="text"
        v-model="project.title"
        @blur="modifyInfo(true)"
      ></textarea>
    </div>

    <div class="row justify-between q-mt-sm">
      <div
        class="col"
        style="font-size: 1rem"
      >
        Author(s)
      </div>
      <input
        class="col-8 input"
        type="text"
        placeholder="First Last / Last, First"
        v-model.trim="name"
        @keydown.enter="addAuthor"
      />
    </div>

    <div class="row q-mt-sm">
      <q-chip
        v-for="(author, index) in authors"
        :key="index"
        :ripple="false"
        class="col-12"
        dense
        :label="author"
        removable
        @remove="removeAuthor(index)"
      />
    </div>

    <div
      class="col q-mt-sm"
      style="font-size: 1rem"
    >
      Abstract
    </div>
    <div class="row">
      <textarea
        style="min-height: 10rem"
        class="col input"
        v-model="project.abstract"
        @blur="modifyInfo(false)"
      ></textarea>
    </div>

    <div class="row justify-between q-mt-sm">
      <div
        class="col"
        style="font-size: 1rem"
      >
        DOI
      </div>
      <input
        class="col-8 input"
        type="text"
        v-model="project.DOI"
        @blur="modifyInfo(false)"
      />
    </div>

    <div class="row justify-between q-mt-sm">
      <div
        class="col"
        style="font-size: 1rem"
      >
        ISBN
      </div>
      <input
        class="col-8 input"
        type="text"
        v-model="project.isbn"
        @blur="modifyInfo(false)"
      />
    </div>

    <div class="row justify-between q-mt-sm">
      <div
        class="col"
        style="font-size: 1rem"
      >
        Attached File
      </div>
      <input
        class="col-8 input"
        type="text"
        v-model="project.path"
        @blur="modifyInfo(false)"
      />
    </div>

    <div class="row justify-between q-mt-sm">
      <div
        class="col"
        style="font-size: 1rem"
      >
        Tags
      </div>
      <input
        class="col-8 input"
        type="text"
        v-model.trim="tag"
        @keydown.enter="addTag"
      />
    </div>
    <div class="q-pb-sm">
      <q-chip
        v-for="(tag, index) in project.tags"
        :key="index"
        :ripple="false"
        dense
        icon="bookmark"
        :label="tag"
        removable
        @remove="removeTag(tag)"
      />
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
      name: "", // author name
      tag: "", // project tag
    };
  },

  computed: {
    authors() {
      let authors = this.project.author;
      if (!!!authors?.length) return "";

      let names = [];
      for (let author of authors) {
        if (!!!author) continue;
        if (!!author.literal) names.push(author.literal);
        else names.push(`${author.given} ${author.family}`);
      }
      console.log(names);
      return names;
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

    /**
     * Update project info
     * @param {boolean} updateRelated - if true, also modify info in related projects
     */
    async modifyInfo(updateRelated) {
      // update db and also update rev in this.project
      this.project = await updateProject(this.project);

      if (updateRelated) {
        let sourceNode = {
          id: this.project._id,
          label: this.project.title,
          type: "project",
        };
        await updateEdge(this.project._id, { sourceNode: sourceNode });
      }

      // update table data
      this.$emit("updateProject", this.project);
    },

    async addAuthor() {
      if (this.name.trim() === "") return;
      // update ui
      let author = {};
      if (this.name.includes(",")) {
        [author.family, author.given] = this.name
          .split(",")
          .map((item) => item.trim());
      } else {
        let truncks = this.name.split(" ");
        if (truncks.length === 1) {
          author.literal = this.name;
        } else {
          author.family = truncks.pop();
          author.given = truncks.join("");
        }
      }
      this.project.author.push(author);

      // update db
      this.modifyInfo(false);
    },

    async removeAuthor(index) {
      // update ui
      this.project.author.splice(index, 1);

      // update db
      this.modifyInfo(false);
    },

    async addTag() {
      // update ui
      this.project.tags.push(this.tag);
      this.tag = ""; // remove text in input

      // update table data for immediate search
      this.$emit("updateProject", this.project);

      // update db
      this.modifyInfo(false);
    },

    async removeTag(tag) {
      // update ui
      this.project.tags = this.project.tags.filter((t) => t != tag);

      // update table data for immediate search
      this.$emit("updateProject", this.project);

      // update db
      this.modifyInfo(false);
    },
  },
};
</script>
<style lang="scss" scoped>
.input {
  color: var(--color-text);
  background: var(--color-rightmenu-tab-panel-bkgd);
  border: 1px solid grey;
  font-size: 1rem;
  &:focus-visible {
    outline: none !important;
    border: 2px solid $primary;
  }
}
</style>
