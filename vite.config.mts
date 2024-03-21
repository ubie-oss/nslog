import { defineConfig } from "vitest/config";

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  esbuild: {
    target: "esnext",
    platform: "node",
  },
});
