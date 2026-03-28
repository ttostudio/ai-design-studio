import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  // 結合テストと E2E テストはそれぞれ専用 config で実行するため除外
  testPathIgnorePatterns: [
    "/node_modules/",
    "/.next/",
    "/src/__tests__/integration/",
    "/e2e/",
  ],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/app/api/**",
    "!src/app/layout.tsx",
    "!src/app/**/page.tsx",
    "!src/lib/db.ts",
    "!src/lib/comfyui-client.ts",
    "!src/lib/api.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
};

export default createJestConfig(config);
