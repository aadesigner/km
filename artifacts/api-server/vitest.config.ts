import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../kmcheck/src"),
    },
  },
  test: {
    setupFiles: ["./vitest.setup.ts"],
    include: [
    "src/**/*.test.ts",
    "../kmcheck/src/lib/**/*.test.ts",
    "../kmcheck/src/components/admin/**/*.test.ts",
    "../../lib/korean-registry/**/*.test.ts",
    "../../lib/vin-decode/**/*.test.ts",
  ],
    environment: "node",
    reporters: ["verbose"],
  },
});
