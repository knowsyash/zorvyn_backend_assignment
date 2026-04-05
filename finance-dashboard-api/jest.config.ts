import type { Config } from "jest";

const config: Config = {
    preset: "ts-jest",
    testEnvironment: "node",
    setupFilesAfterEnv: ["<rootDir>/src/tests/setup.ts"],
    testMatch: ["**/*.test.ts"],
    testTimeout: 30000,
    collectCoverageFrom: ["src/**/*.ts", "!src/server.ts"],
    coverageThreshold: {
        global: {
            branches: 75,
            functions: 80,
            lines: 80,
            statements: 80,
        },
    },
};

export default config;
