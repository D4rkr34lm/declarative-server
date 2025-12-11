import { config } from "typescript-eslint";

import baseConfig from "./eslint.base.config.js";

export default config(baseConfig, {
  files: ["**/*.ts"],
});
