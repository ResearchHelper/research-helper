<template>
  <q-menu square>
    <q-list dense>
      <q-item clickable>
        <q-item-section @mouseover="$refs.submenu.show()">Add</q-item-section>
        <q-item-section side><q-icon name="arrow_right" /></q-item-section>
        <q-menu
          square
          anchor="top end"
          self="top start"
          ref="submenu"
        >
          <q-list dense>
            <q-item clickable>
              <q-item-section>From PDF</q-item-section>
            </q-item>
            <q-item clickable>
              <q-item-section>From DOI</q-item-section>
            </q-item>
            <q-item clickable>
              <q-item-section>From BibTex</q-item-section>
            </q-item>
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
