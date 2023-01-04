<template>
  <q-menu square>
    <q-list dense>
      <q-item clickable>
        <q-item-section>Add</q-item-section>
        <q-item-section side><q-icon name="arrow_right" /></q-item-section>
        <q-menu
          anchor="top end"
          self="top start"
        >
          <q-list dense>
            <q-item clickable>From PDF</q-item>
            <q-item clickable>From DOI</q-item>
            <q-item clickable>From BibTex</q-item>
          </q-list>
        </q-menu>
      </q-item>

      <q-separator />

      <q-item clickable><q-item-section>Quit</q-item-section></q-item>
    </q-list>
  </q-menu>
</template>
<script>
export default {};
</script>
