import { loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  root: "./src",
  test: {
    env: loadEnv("", ".", ""),
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["html-spa", "text"],
      include: ["*"],
      reportsDirectory: "../coverage",
      enabled: true,
      all: false,
      cleanOnRerun: true,
    },
  },
  define: {},
  plugins: [tsconfigPaths()],
});
