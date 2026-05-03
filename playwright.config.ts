import { defineConfig, devices } from '@playwright/test';

const BASE_PORT = 4322;
const BASE_URL = `http://127.0.0.1:${BASE_PORT.toString()}/cv/`;

export default defineConfig({
  testDir: 'tests/visual',
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  snapshotPathTemplate: '{testDir}/__snapshots__/{testFileName}/{arg}{ext}',
  use: {
    baseURL: BASE_URL,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: 'no-preference',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port ${BASE_PORT.toString()}`,
    url: BASE_URL,
    reuseExistingServer: true,
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 60_000,
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.0,
      animations: 'disabled',
      caret: 'hide',
    },
  },
});
