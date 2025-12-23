import eslintVitest from "@vitest/eslint-plugin";
import { config } from "typescript-eslint";

export default config(eslintVitest.configs.recommended, {
  files: ["**/*.spec.ts"],
  rules: {
    "vitest/expect-expect": "off",
  },
});
