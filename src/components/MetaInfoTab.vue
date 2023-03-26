<template>
  <!-- show this after rightMenu is shown, 
    otherwise autogrow extends to full-height -->
  <q-tabs
    v-if="meta?.reference?.length > 0"
    v-model="tab"
    dense
    no-caps
  >
    <q-tab name="meta">{{ $t("info") }}</q-tab>
    <q-tab name="reference">{{ $t("reference") }}</q-tab>
  </q-tabs>
  <q-tab-panels
    v-if="!!meta"
    v-model="tab"
  >
    <q-tab-panel name="meta">
      <div class="row justify-between">
        <div
          class="col"
          style="font-size: 1rem"
        >
          {{ $t("type") }}
        </div>
        <input
          class="col-8 input"
          type="text"
          v-model="meta.type"
          @blur="modifyInfo(true)"
        />
      </div>

      <div class="row q-mt-sm">
        <div
          class="col"
          style="font-size: 1rem"
        >
          {{ $t("title") }}
        </div>
      </div>
      <div class="row q-mt-sm">
        <textarea
          style="min-height: 5rem"
          class="col input"
          type="text"
          v-model="meta.title"
          @blur="modifyInfo(true)"
        ></textarea>
      </div>

      <div class="row justify-between q-mt-sm">
        <div
          class="col"
          style="font-size: 1rem"
        >
          {{ $t("year") }}
        </div>
        <input
          class="col-8 input"
          type="text"
          v-model="meta.year"
          @blur="modifyInfo(true)"
        />
      </div>

      <div class="row justify-between q-mt-sm">
        <div
          class="col"
          style="font-size: 1rem"
        >
          {{ $t("author") }}
        </div>
        <input
          class="col-8 input"
          type="text"
          :placeholder="$t('first-last-last-first')"
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
        {{ $t("abstract") }}
      </div>
      <div class="row">
        <textarea
          style="min-height: 10rem"
          class="col input"
          v-model="meta.abstract"
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
          v-model="meta.DOI"
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
          v-model="meta.ISBN"
          @blur="modifyInfo(false)"
        />
      </div>

      <div class="row justify-between q-mt-sm">
        <div
          class="col"
          style="font-size: 1rem"
        >
          URL
          <q-btn
            flat
            padding="none"
            size="xs"
            icon="bi-box-arrow-up-right"
            :disable="!!!meta.URL"
            @click="
              (e) => {
                e.preventDefault();
                this.openURL(meta.URL);
              }
            "
          />
        </div>
        <input
          class="col-8 input"
          type="url"
          placeholder="https://..."
          v-model.trim="meta.URL"
          @blur="modifyInfo(false)"
        />
      </div>

      <div class="row justify-between q-mt-sm">
        <div
          class="col"
          style="font-size: 1rem"
        >
          {{ $t("file") }}
        </div>
        <input
          class="col-8 input"
          type="text"
          v-model="meta.path"
          @blur="modifyInfo(false)"
        />
      </div>

      <div class="row justify-between q-mt-sm">
        <div
          class="col"
          style="font-size: 1rem"
        >
          {{ $t("tags") }}
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
          v-for="(tag, index) in meta.tags"
          :key="index"
          :ripple="false"
          dense
          icon="bookmark"
          :label="tag"
          removable
          @remove="removeTag(tag)"
        />
      </div>
    </q-tab-panel>

    <q-tab-panel name="reference">
      <div
        v-for="(ref, ind) of references"
        :key="ind"
        class="q-pb-sm"
      >
        <div v-html="`${ind + 1}. ${ref.text}`"></div>
        <div
          v-if="!!ref.link"
          class="link"
          :href="ref.link"
          @click="openURL(ref.link)"
        >
          {{ ref.link }}
        </div>
      </div>
    </q-tab-panel>
  </q-tab-panels>
</template>

<script>
import { useStateStore } from "src/stores/appState";
import { updateProject } from "src/backend/project/project";
import { updateEdge } from "src/backend/project/graph";
import { getMeta } from "src/backend/project/meta";

export default {
  props: { project: Object },
  emits: ["update:project"],

  setup() {
    const stateStore = useStateStore();
    return { stateStore };
  },

  data() {
    return {
      tab: "meta",
      name: "", // author name
      tag: "", // project tag
      references: [],
    };
  },

  watch: {
    tab() {
      if (this.tab === "reference") this.getReferences();
    },
  },

  computed: {
    meta: {
      get() {
        return this.project;
      },
      set(newMeta) {
        this.$emit("update:project", newMeta);
      },
    },

    authors() {
      let authors = this.meta.author;
      if (!!!authors?.length) return "";

      let names = [];
      for (let author of authors) {
        if (!!!author) continue;
        if (!!author.literal) names.push(author.literal);
        else names.push(`${author.given} ${author.family}`);
      }
      return names;
    },
  },

  methods: {
    /**
     * Update project info
     * @param {boolean} updateRelated - if true, also modify info in related projects
     */
    async modifyInfo(updateRelated) {
      // update db and also update rev in this.project
      let meta = await updateProject(this.meta);
      this.meta._rev = meta._rev;

      if (updateRelated) {
        let sourceNode = {
          id: this.meta._id,
          label: this.meta.title,
          type: "project",
        };
        await updateEdge(this.meta._id, { sourceNode: sourceNode });
      }
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
          author.given = truncks.join(" ");
        }
      }
      this.meta.author.push(author);
      this.name = "";

      // update db
      this.modifyInfo(false);
    },

    async removeAuthor(index) {
      // update ui
      this.meta.author.splice(index, 1);

      // update db
      this.modifyInfo(false);
    },

    async addTag() {
      // update ui
      this.meta.tags.push(this.tag);
      this.tag = ""; // remove text in input

      // update db
      this.modifyInfo(false);
    },

    async removeTag(tag) {
      // update ui
      this.meta.tags = this.meta.tags.filter((t) => t != tag);

      // update db
      this.modifyInfo(false);
    },

    async getReferences() {
      if (!!!this.meta?.reference || this.references.length > 0) return;

      for (let i in this.meta.reference) {
        this.references.push({ text: "", link: undefined });
      }

      for (let [i, ref] of this.meta.reference.entries()) {
        try {
          this.references[i].text = getMeta(
            ref.DOI || ref.key,
            "bibliography",
            {
              format: "html",
            }
          );
          this.references[i].link = this.references[i].text.match(
            /(https[a-zA-Z0-9:\.\/\-\_]+)/g
          )[0];
          this.references[i].text = this.references[i].text.replace(
            /(https[a-zA-Z0-9:\.\/\-\_]+)/g,
            ""
          );
        } catch (error) {
          let author = !!ref.author ? ref.author + " " : "";
          let year = !!ref.year ? `(${ref.year}) ` : "";
          let title =
            ref["article-title"] || ref["series-title"] || ref.unstructured;
          this.references[i].text = `<div>${author + year + title}</div>`;
          if (ref.DOI || ref.key)
            this.references[i].link = "https://doi.org/" + (ref.DOI || ref.key);
        }
      }
    },

    openURL(url) {
      window.browser.openURL(url);
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

.link {
  color: $primary;
  text-decoration: underline;
  &:hover {
    cursor: pointer;
  }
}
</style>
