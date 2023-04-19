// This file will be run before each test file
import { config } from "@vue/test-utils";
import { setActivePinia, createPinia } from "pinia";

// i18n
config.global.mocks = {
  $t: (tKey: string) => tKey, // just return translation key
};
// pinia
setActivePinia(createPinia());
