<template>
  <q-toolbar>
    <q-btn
      flat
      dense
      icon="add"
    >
    </q-btn>
    <q-btn
      flat
      dense
      icon="delete"
    >
    </q-btn>

    <q-space />

    <q-input
      outlined
      dense
      v-model="search"
      placeholder="Search"
    >
      <template v-slot:append>
        <q-icon
          class="cursor-pointer"
          name="search"
        />
      </template>
    </q-input>

    <q-space />

    <q-btn
      flat
      dense
      icon="list"
    >
    </q-btn>
  </q-toolbar>
</template>

<script>
export default {
  data() {
    return {
      search: "",
    };
  },
};
</script>

<style></style>
