import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Testing Configuration
 *
 * Comprehensive testing setup for all 104+ pages
 * Desktop, tablet, and mobile testing
 * Screenshot and video capture on failures
 * Chromatic visual regression integration
 *
 * Created: October 3, 2025
 * Updated: January 25, 2025 - Added Chromatic integration
 */

export default defineConfig({
  testDir: './tests/e2e',

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'reports/playwright-report', open: 'never' }],
    ['json', { outputFile: 'reports/test-results.json' }],
    ['list'],
    ['junit', { outputFile: 'reports/junit-results.xml' }],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for all tests
    baseURL: 'http://localhost:3000',

    // Collect trace only on first retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Maximum time per action
    actionTimeout: 10000,

    // Navigation timeout
    navigationTimeout: 30000,
  },

  // Configure projects for major browsers and devices
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    {
      name: 'firefox-desktop',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    {
      name: 'webkit-desktop',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    // Mobile devices
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },

    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },

    // Tablet devices
    {
      name: 'tablet-ipad',
      use: { ...devices['iPad Pro'] },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes to start server
  },

  // Global timeout for each test
  timeout: 60000, // 1 minute per test

  // Expect timeout for assertions
  expect: {
    timeout: 10000, // 10 seconds

    // Visual regression settings
    toHaveScreenshot: {
      /* Maximum pixel difference threshold */
      maxDiffPixels: 100,

      /* Threshold for pixel color difference (0-1) */
      threshold: 0.2,

      /* Animation handling */
      animations: 'disabled',

      /* CSS animations */
      caret: 'hide',

      /* Screenshot comparison mode */
      scale: 'css',
    },
  },
});
