import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end checks of the landing on desktop and phone, against the Vite dev server.
 * Installed Chrome and Playwright WebKit, each on desktop and an emulated phone.
 * Needs Node.js 24 LTS on PATH (Bun cannot host the runner); WebKit is not the installed Safari app.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { channel: "chrome", viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"], channel: "chrome" } },
    {
      name: "safari-desktop",
      use: { browserName: "webkit", viewport: { width: 1440, height: 900 } },
    },
    { name: "safari-mobile", use: { ...devices["iPhone 13"], browserName: "webkit" } },
  ],
  webServer: {
    command: "bun run dev --port 5173 --host 127.0.0.1",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
