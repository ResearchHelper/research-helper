<template>
  <div class="q-pa-md q-gutter-sm">
    <q-tree
      :nodes="simple"
      node-key="label"
      :duration="0"
      v-model:selected="selected"
    />
  </div>

  {{ selected }}
</template>

<script>
export default {
  data() {
    return {
      simple: [
        {
          label: "1",
          children: [
            {
              label: "1.1",
              children: [],
            },
            {
              label: "1.2",
              children: [],
            },
          ],
        },
      ],

      selected: null,
    };
  },
};
</script>
