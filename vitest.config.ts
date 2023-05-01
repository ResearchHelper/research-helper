import { defineConfig } from "vitest/config";
// import vue from "@vitejs/plugin-vue";
import veauryVitePlugins from "veaury/vite/index.js";
import { quasar, transformAssetUrls } from "@quasar/vite-plugin";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    environment: "happy-dom",
    setupFiles: "test/vitest/setup-file.ts",
    include: [
      // Matches vitest tests in any subfolder of 'src' or into 'test/vitest/__tests__'
      // Matches all files with extension 'js', 'jsx', 'ts' and 'tsx'
      "src/**/*.vitest.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "test/vitest/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
  },
  plugins: [
    // vue({
    //   template: { transformAssetUrls },
    // }),
    veauryVitePlugins({
      type: "vue",
      // Configuration of @vitejs/plugin-vue
      vueOptions: { template: { transformAssetUrls } },
    }),
    quasar({
      sassVariables: "src/quasar-variables.scss",
    }),
    tsconfigPaths(),
  ],
});
