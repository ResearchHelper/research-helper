<template>
  <q-menu>
    <q-list dense>
      <q-item clickable>
        <q-item-section>Appearance</q-item-section>
        <q-item-section side><q-icon name="arrow_right" /></q-item-section>

        <q-menu
          anchor="top end"
          self="top start"
        >
          <q-list dense>
            <q-item clickable>
              <q-item-section side>
                <q-checkbox
                  dense
                  v-model="showLibrary"
                />
              </q-item-section>
              <q-item-section>Libray Page</q-item-section>
            </q-item>
            <q-item clickable>
              <q-item-section side>
                <q-checkbox
                  dense
                  v-model="showSetting"
                />
              </q-item-section>
              <q-item-section>Setting Page</q-item-section>
            </q-item>
            <q-item clickable>
              <q-item-section side>
                <q-checkbox
                  dense
                  v-model="showLeftMenu"
                />
              </q-item-section>
              <q-item-section>Left Menu</q-item-section>
            </q-item>
            <q-item clickable>
              <q-item-section side>
                <q-checkbox
                  dense
                  v-model="showRightMenu"
                />
              </q-item-section>
              <q-item-section>Right Menu</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-item>
    </q-list>
  </q-menu>
</template>
<script>
export default {
  data() {
    return {
      showLibrary: true,
      showSetting: false,
      showLeftMenu: true,
      showRightMenu: false,
    };
  },
};
</script>
