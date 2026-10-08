import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3100);
const MOCK_API_PORT = Number(process.env.MOCK_API_PORT ?? 3999);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

/** Secret the e2e run uses to call /api/revalidate-pricing. Not a real secret. */
export const E2E_REVALIDATE_SECRET = "e2e-revalidate-secret";
export const MOCK_API_URL = `http://127.0.0.1:${MOCK_API_PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "desktop-chromium",
      testIgnore: /pricing-api\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      testIgnore: /pricing-api\.spec\.ts/,
      // 360px wide: the smallest width the site supports.
      use: { ...devices["Pixel 5"], viewport: { width: 360, height: 760 } },
    },
    {
      // Switches the mock API between modes, so it runs alone after everything else.
      name: "pricing-api",
      testMatch: /pricing-api\.spec\.ts/,
      dependencies: ["desktop-chromium", "mobile-chromium"],
      fullyParallel: false,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Runs against a production build. Set PLAYWRIGHT_BASE_URL to test a deployed site instead.
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : [
        {
          command: `node tests/e2e/mock-api/server.mjs`,
          url: `${MOCK_API_URL}/health`,
          reuseExistingServer: !process.env.CI,
          env: { MOCK_API_PORT: String(MOCK_API_PORT) },
        },
        {
          command: `npm run start -- --port ${PORT}`,
          url: `${baseURL}/en`,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          env: {
            NEXTREACH_API_URL: MOCK_API_URL,
            REVALIDATE_SECRET: E2E_REVALIDATE_SECRET,
          },
        },
      ],
});
