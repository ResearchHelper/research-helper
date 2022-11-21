<template>
  <q-btn @click="get"> Get </q-btn>
  <q-btn @click="post"> Post </q-btn>
  <q-btn @click="put"> Put </q-btn>
  <q-btn @click="del"> Delete </q-btn>
  <q-btn @click="find"> Find </q-btn>
  <q-btn @click="destroy"> Destroy database </q-btn>
  <q-input
    v-model="id"
    placeholder="_id"
  />
  <q-input
    v-model="rev"
    placeholder="_rev"
  />
  <q-input
    v-model="json"
    placeholder="json"
  />
</template>

<script>
import { destroyDB } from "src/api/database";
import {
  getAnnotations,
  getAnnotationsByPage,
  getAnnotationById,
  addAnnotation,
  updateAnnotation,
  deleteAnnotation,
} from "src/api/annotation";

export default {
  data() {
    return {
      id: "",
      rev: "",
      json: "",
    };
  },

  methods: {
    get() {
      let promise = !!this.id ? getAnnotationById(this.id) : getAnnotations();
      promise
        .then((response) => {
          console.log(response);
        })
        .catch((err) => {
          console.log(err);
        });
    },

    post() {
      addAnnotation(JSON.parse(this.json))
        .then((response) => {
          console.log(response);
        })
        .catch((err) => {
          console.log(err);
        });
    },

    put() {
      if (!!this.id) {
        getAnnotationById({ annotationId: this.id })
          .then((annotation) => {
            console.log("get:", annotation);
            let newAnnotation = JSON.parse(this.json);
            for (let k in newAnnotation) {
              annotation[k] = newAnnotation[k];
            }
            console.log("new:", annotation);
            updateAnnotation(annotation)
              .then((response) => {
                console.log(response);
              })
              .catch((err) => {
                console.log(err);
              });
          })
          .catch((err) => {
            console.log(err);
          });
      }
    },

    del() {
      if (!!this.id) {
        deleteAnnotation(this.id)
          .then((result) => {
            console.log(result);
          })
          .catch((err) => {
            console.log(err);
          });
      }
    },

    find() {
      getAnnotationsByPage(2)
        .then((result) => {
          console.log(result);
          for (let el of result.docs) {
            console.log(el);
          }
        })
        .catch((err) => {
          console.log(err);
        });
    },

    destroy() {
      destroyDB().then((result) => {
        console.log(result);
      });
    },
  },
};
</script>
