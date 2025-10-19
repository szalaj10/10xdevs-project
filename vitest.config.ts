import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Environment configuration
    environment: "jsdom",

    // Setup files
    setupFiles: ["./tests/setup.ts"],

    // Global test configuration
    globals: true,

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "dist/",
        "tests/",
        "e2e/",
        "examples/",
        "**/*.config.*",
        "**/*.d.ts",
        "**/types.ts",
        "**/.astro/",
        // Exclude UI components and pages from coverage thresholds
        "src/components/**",
        "src/pages/**",
        "src/layouts/**",
        "src/middleware/**",
        // Exclude generated types
        "src/db/database.types.ts",
        // Exclude setup files
        "setup-test-user.js",
      ],
      // Per-file coverage thresholds for tested files only
      perFile: true,
      thresholds: {
        perFile: true,
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
        // Automatically skip files with 0% coverage (not yet tested)
        autoUpdate: false,
      },
      // Only include files that are imported by tests
      all: false,
    },

    // Include/exclude patterns
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["node_modules", "dist", ".astro", "e2e"],

    // Test timeout
    testTimeout: 10000,

    // Reporters
    reporters: ["verbose"],
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/lib": path.resolve(__dirname, "./src/lib"),
      "@/db": path.resolve(__dirname, "./src/db"),
      "@/types": path.resolve(__dirname, "./src/types.ts"),
    },
  },
});
