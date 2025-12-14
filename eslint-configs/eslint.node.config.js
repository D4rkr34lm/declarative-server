import globals from "globals";
import { config } from "typescript-eslint";

import baseConfig from "./eslint.base.config.js";

export default config(baseConfig, {
  files: ["**/*.ts"],
  languageOptions: {
    globals: {
      ...globals.node,
    },
  },
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-empty-object-type": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
  },
});
