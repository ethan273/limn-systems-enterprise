import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

export default defineConfig({
  testDir: './tests',
  // ONLY match our numbered spec files, exclude all other test files
  testMatch: '**/*[0-9]-*.spec.ts',
  // Ignore all subdirectories to avoid Vitest files
  testIgnore: [
    '**/api/**',
    '**/integration/**',
    '**/unit/**',
    '**/visual/**',
    '**/e2e/**',
    '**/ai-testing/**',
    '**/*.test.ts',
    '**/*.test.js',
    '**/node_modules/**'
  ],
  outputDir: path.join(__dirname, 'test-results', 'test-artifacts'),
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,  // Retry failed tests: 2 for CI, 1 for local
  workers: process.env.CI ? 1 : 2,  // Memory-safe: 1 for CI, 2 for local (NOT 3+)
  globalSetup: './tests/global-setup.ts',  // Setup portal test users before tests run
  reporter: [
    ['html', {
      outputFolder: path.join(__dirname, 'test-results', 'html-report'),
      open: 'never'
    }],
    ['json', {
      outputFile: path.join(__dirname, 'test-results', 'results.json')
    }],
    ['list', { printSteps: true }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30000,  // Phase 2 fix: Increased to 30s to reduce flaky tests
    navigationTimeout: 60000,  // Phase 2 fix: Increased to 60s for data-heavy page loads
    headless: true
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Automatic dev server management - Playwright starts/stops server automatically
  // This ensures fresh server for each test suite run and prevents mid-test crashes
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    timeout: 120000, // 2 minutes to start
    reuseExistingServer: !process.env.CI, // Reuse in local dev, fresh in CI
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
