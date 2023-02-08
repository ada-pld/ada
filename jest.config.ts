import type { Config } from "jest";

const config: Config = {
    preset: "ts-jest",
    verbose: true,
    globalSetup: "<rootDir>/tests/setup/setup.js",
    setupFiles: ["<rootDir>/tests/setup/globals.js"]
}

export default config;