import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.PATCHWORK_BASE_URL ?? "http://127.0.0.1:4175",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "laptop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 960 },
      },
    },
    {
      name: "tablet",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 834, height: 1194 },
        hasTouch: true,
      },
    },
  ],
  webServer: process.env.PATCHWORK_BASE_URL
    ? undefined
    : {
        command:
          "npm run build && npm run preview -- --host 127.0.0.1 --port 4175",
        url: "http://127.0.0.1:4175",
        reuseExistingServer: false,
      },
});
