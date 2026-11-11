import { defineConfig } from "vitest/config";

const sourceConditions = ["@nero-agent/source", "module", "node", "development|production"];

const workspaces = ["packages/core", "packages/providers", "packages/runtime", "apps/cli"];

export default defineConfig({
  ssr: {
    resolve: { conditions: sourceConditions },
  },
  test: {
    projects: workspaces.map((root) => ({
      extends: true,
      test: { name: root.split("/")[1] ?? root, root, include: ["src/**/*.test.{ts,tsx}"] },
    })),
  },
});
