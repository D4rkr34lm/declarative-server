import eslintVitest from "@vitest/eslint-plugin";
import globals from "globals";
import { config } from "typescript-eslint";

export default config(eslintVitest.configs.recommended, {
  files: ["**/*.spec.ts"],
  languageOptions: {
    globals: {
      ...globals.vitest,
    },
  },
});
