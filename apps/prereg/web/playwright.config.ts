import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:5176', headless: true },
  webServer: [
    {
      command: 'npm run test:browser-server -w @awb/prereg-api',
      cwd: '../../..',
      url: 'http://127.0.0.1:3001/health',
      env: { NODE_ENV: 'test', BCRYPT_ROUNDS: '4', APP_ORIGIN: 'http://127.0.0.1:5176' },
      reuseExistingServer: false,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5176 --strictPort',
      url: 'http://127.0.0.1:5176',
      env: { PREREG_API_URL: 'http://127.0.0.1:3001' },
      reuseExistingServer: false,
    },
  ],
})
