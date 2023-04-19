import { boot } from "quasar/wrappers";
import { createI18n } from "vue-i18n";
import en_US from "src/i18n/en_US.json";
import zh_CN from "src/i18n/zh_CN.json";

const messages = {
  en_US,
  zh_CN,
};

export type MessageLanguages = keyof typeof messages;
// Type-define 'en-US' as the master schema for the resource
export type MessageSchema = (typeof messages)["en_US"];

// See https://vue-i18n.intlify.dev/guide/advanced/typescript.html#global-resource-schema-type-definition
/* eslint-disable @typescript-eslint/no-empty-interface */
declare module "vue-i18n" {
  // define the locale messages schema
  export interface DefineLocaleMessage extends MessageSchema {}

  // define the datetime format schema
  export interface DefineDateTimeFormat {}

  // define the number format schema
  export interface DefineNumberFormat {}
}
/* eslint-enable @typescript-eslint/no-empty-interface */
// also export i18n for testing use
export const i18n = createI18n({
  locale: "en_US",
  messages,
});

export default boot(({ app }) => {
  // Set i18n instance on app
  app.use(i18n);
});
