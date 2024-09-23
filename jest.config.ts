import type { Config } from "jest";

const config: Config = {
    coveragePathIgnorePatterns: ["./node_modules/", "./dist/"],
    moduleFileExtensions: ["ts", "js"],
    testMatch: ["./**/*.test.ts"],
    testEnvironment: "node",
    collectCoverage: true,
    preset: "ts-jest",
    verbose: true,
    cache: false
}

export default config;