import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load test environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./e2e",

  /* Run tests in files in parallel */
  fullyParallel: false, // Disable full parallelism to avoid session cookie race conditions

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 3, // Limit workers to avoid session cookie race conditions

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || "http://localhost:4321",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",

    /* Screenshot on failure */
    screenshot: "only-on-failure",

    /* Video on failure */
    video: "retain-on-failure",
  },

  /* Configure projects for major browsers - Using only Chromium as per guidelines */
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Browser context options
        viewport: { width: 1280, height: 720 },
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:4321",
    reuseExistingServer: true, // Always reuse existing server
    timeout: 120 * 1000,
    env: {
      // Pass test env vars to the dev server
      PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL || "",
      PUBLIC_SUPABASE_KEY: process.env.SUPABASE_PUBLIC_KEY || "",
      GROQ_API_KEY: process.env.GROQ_API_KEY || "",
      GROQ_MODEL: process.env.GROQ_MODEL || "",
      GROQ_BASE_URL: process.env.GROQ_BASE_URL || "",
    },
  },
});
