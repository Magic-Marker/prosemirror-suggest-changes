import { defineConfig, devices } from "@playwright/test";
import { type TestOptions } from "./src/__tests__/playwrightBaseTest.js";

export default defineConfig<TestOptions>({
  testDir: "./src",
  testMatch: "**/*.playwright.test.ts",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  ...(process.env["CI"] ? { workers: 1 } : {}),
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "visible deletion marks",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chromium",
        deletionMarksVisibility: "visible",
      },
    },
    {
      name: "hidden deletion marks",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chromium",
        deletionMarksVisibility: "hidden",
      },
    },
  ],
  webServer: {
    command: "npx vite --port 3000 --strictPort",
    port: 3000,
    reuseExistingServer: !process.env["CI"],
  },
});
