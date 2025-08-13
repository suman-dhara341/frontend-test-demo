import { defineConfig, devices } from "@playwright/test";
import { EnvConfigPlaywright } from "./tests/envConfig";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  
  workers: process.env.CI ? 1 : 1,
  testMatch: "test.list.ts",
  reporter: [["dot"]], // Correct tuple format
  timeout: 80000,
  globalSetup: "./tests/authService/auth.spec",
  use: {
    trace: "on-first-retry",
    storageState: "tests/authService/playwright/.auth/user.json",
    baseURL: EnvConfigPlaywright.apiUrl,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
