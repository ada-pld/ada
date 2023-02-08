import type { Config } from "jest";

const config: Config = {
    verbose: true,
    globalSetup: "<rootDir>/tests/setup/setup.js",
}

export default config;