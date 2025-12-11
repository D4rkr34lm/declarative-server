import { globalIgnores } from "eslint/config";
import { config } from "typescript-eslint";

import eslintJS from "@eslint/js";
import prettierEslint from "eslint-plugin-prettier/recommended";
import eslintTS from "typescript-eslint";

export default config(
  globalIgnores([
    "*.config.{mjs|js|ts}",
    "coverage",
    "dist",
    "generated",
    "node_modules",
  ]),
  eslintJS.configs.recommended,
  eslintTS.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },
  prettierEslint,
);
