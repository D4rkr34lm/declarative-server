import { config } from "typescript-eslint";

import nodeConfig from "./eslint-configs/eslint.node.config";
import testConfig from "./eslint-configs/eslint.test.config";

export default config(nodeConfig, testConfig);
