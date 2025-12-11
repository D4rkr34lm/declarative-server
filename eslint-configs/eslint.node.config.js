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
});
