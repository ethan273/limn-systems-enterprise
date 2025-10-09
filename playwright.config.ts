import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

export default defineConfig({
  testDir: './tests',
  // ONLY match our numbered spec files, exclude all other test files
  testMatch: '**/{0,1}[0-9]-*.spec.ts',
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
  outputDir: '/Users/eko3/limn-systems-enterprise-docs/02-TESTING/test-results/test-artifacts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,  // Retry failed tests: 2 for CI, 1 for local
  workers: process.env.CI ? 1 : 2,  // Memory-safe: 1 for CI, 2 for local (NOT 3+)
  reporter: [
    ['html', {
      outputFolder: '/Users/eko3/limn-systems-enterprise-docs/02-TESTING/test-results/html-report',
      open: 'never'
    }],
    ['json', {
      outputFile: '/Users/eko3/limn-systems-enterprise-docs/02-TESTING/test-results/results.json'
    }],
    ['list', { printSteps: true }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 20000,  // Increased from 15000ms to handle slow animations
    navigationTimeout: 45000,  // Increased from 30000ms for slower page loads
    headless: true
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // webServer config removed - dev server should be started manually before tests
  // This prevents Playwright from trying to start its own server for each test suite
});
