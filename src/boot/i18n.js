import { boot } from "quasar/wrappers";
import { createI18n } from "vue-i18n";
import en_US from "src/i18n/en_US";
import zh_CN from "src/i18n/zh_CN";

const messages = {
  en_US,
  zh_CN,
};

export default boot(({ app }) => {
  const i18n = createI18n({
    locale: "en_US",
    globalInjection: true,
    messages,
  });

  // Set i18n instance on app
  app.use(i18n);
});
