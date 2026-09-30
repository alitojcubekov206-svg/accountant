import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests", timeout: 45000, expect: { timeout: 10000 },
  fullyParallel: false, workers: 1, retries: 0, reporter: "list",
  use: { baseURL: "http://127.0.0.1:8787", ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}), trace: "off", screenshot: "only-on-failure", launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: { command: "pnpm exec wrangler dev dist/server/index.js --config wrangler.jsonc --no-bundle --assets dist/client --ip 127.0.0.1 --port 8787 --local --persist-to .wrangler/test-state", url: "http://127.0.0.1:8787/api/health", reuseExistingServer: false, timeout: 90000 },
});
