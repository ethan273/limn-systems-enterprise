#!/usr/bin/env tsx
/**
 * Comprehensive UI Screenshot Capture Script
 * Captures all application pages in both light and dark modes
 * for UI analysis and style issue detection.
 */

import { chromium, type Browser, type Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots', 'audit');
const LIGHT_DIR = path.join(SCREENSHOT_DIR, 'light');
const DARK_DIR = path.join(SCREENSHOT_DIR, 'dark');

// All pages to test
const PAGES = {
  authentication: [
    { path: '/login', name: 'login' },
    { path: '/auth/employee', name: 'auth-employee' },
    { path: '/auth/contractor', name: 'auth-contractor' },
    { path: '/auth/customer', name: 'auth-customer' },
    { path: '/auth/dev', name: 'auth-dev' },
  ],
  dashboard: [
    { path: '/dashboard', name: 'dashboard', requiresAuth: true },
    { path: '/crm/projects', name: 'crm-projects', requiresAuth: true },
    { path: '/crm/clients', name: 'crm-clients', requiresAuth: true },
  ],
  products: [
    { path: '/products/materials', name: 'products-materials', requiresAuth: true },
    { path: '/products/catalog', name: 'products-catalog', requiresAuth: true },
    { path: '/products/prototypes', name: 'products-prototypes', requiresAuth: true },
    { path: '/products/concepts', name: 'products-concepts', requiresAuth: true },
    { path: '/products/ordered-items', name: 'products-ordered-items', requiresAuth: true },
  ],
  production: [
    { path: '/production/orders', name: 'production-orders', requiresAuth: true },
    { path: '/production/orders/new', name: 'production-orders-new', requiresAuth: true },
    { path: '/production/ordered-items', name: 'production-ordered-items', requiresAuth: true },
    { path: '/production/qc', name: 'production-qc', requiresAuth: true },
    { path: '/production/shipments', name: 'production-shipments', requiresAuth: true },
  ],
  operations: [
    { path: '/tasks', name: 'tasks', requiresAuth: true },
    { path: '/tasks/my', name: 'tasks-my', requiresAuth: true },
    { path: '/shipping', name: 'shipping', requiresAuth: true },
    { path: '/shipping/shipments', name: 'shipping-shipments', requiresAuth: true },
    { path: '/shipping/tracking', name: 'shipping-tracking', requiresAuth: true },
  ],
  financials: [
    { path: '/financials/invoices', name: 'financials-invoices', requiresAuth: true },
    { path: '/financials/payments', name: 'financials-payments', requiresAuth: true },
  ],
  documents: [
    { path: '/documents', name: 'documents', requiresAuth: true },
  ],
};

interface ScreenshotResult {
  page: string;
  theme: 'light' | 'dark';
  success: boolean;
  screenshot?: string;
  consoleErrors: string[];
  consoleWarnings: string[];
  networkErrors: string[];
}

const results: ScreenshotResult[] = [];

async function captureScreenshot(
  page: Page,
  pagePath: string,
  pageName: string,
  theme: 'light' | 'dark'
): Promise<ScreenshotResult> {
  const result: ScreenshotResult = {
    page: pagePath,
    theme,
    success: false,
    consoleErrors: [],
    consoleWarnings: [],
    networkErrors: [],
  };

  try {
    // Capture console messages
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        result.consoleErrors.push(text);
      } else if (type === 'warning') {
        result.consoleWarnings.push(text);
      }
    });

    // Capture network errors
    page.on('response', (response) => {
      if (!response.ok() && response.status() !== 304) {
        result.networkErrors.push(
          `${response.status()} ${response.statusText()} - ${response.url()}`
        );
      }
    });

    // Navigate to page
    console.log(`📸 Capturing ${theme} mode: ${pagePath}`);
    await page.goto(`${BASE_URL}${pagePath}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait a bit for any animations or lazy loading
    await page.waitForTimeout(2000);

    // Take screenshot
    const dir = theme === 'light' ? LIGHT_DIR : DARK_DIR;
    const filename = `${pageName}.png`;
    const filepath = path.join(dir, filename);

    await page.screenshot({
      path: filepath,
      fullPage: true,
    });

    result.success = true;
    result.screenshot = filepath;
    console.log(`✅ Saved: ${filepath}`);
  } catch (error) {
    console.error(`❌ Error capturing ${pagePath} (${theme}):`, error);
    result.consoleErrors.push(
      error instanceof Error ? error.message : String(error)
    );
  }

  return result;
}

async function captureAllScreenshots() {
  console.log('🚀 Starting comprehensive UI screenshot capture...\n');

  // Create directories
  fs.mkdirSync(LIGHT_DIR, { recursive: true });
  fs.mkdirSync(DARK_DIR, { recursive: true });

  // Launch browser for light mode
  console.log('🌞 Launching browser in LIGHT mode...');
  const lightBrowser = await chromium.launch({
    headless: true,
  });

  const lightContext = await lightBrowser.newContext({
    viewport: { width: 1920, height: 1080 },
    colorScheme: 'light',
  });

  const lightPage = await lightContext.newPage();

  // Capture all pages in light mode
  for (const [category, pages] of Object.entries(PAGES)) {
    console.log(`\n📂 Category: ${category.toUpperCase()}`);
    for (const pageInfo of pages) {
      const result = await captureScreenshot(
        lightPage,
        pageInfo.path,
        pageInfo.name,
        'light'
      );
      results.push(result);
    }
  }

  await lightBrowser.close();

  // Launch browser for dark mode
  console.log('\n🌙 Launching browser in DARK mode...');
  const darkBrowser = await chromium.launch({
    headless: true,
  });

  const darkContext = await darkBrowser.newContext({
    viewport: { width: 1920, height: 1080 },
    colorScheme: 'dark',
  });

  const darkPage = await darkContext.newPage();

  // Capture all pages in dark mode
  for (const [category, pages] of Object.entries(PAGES)) {
    console.log(`\n📂 Category: ${category.toUpperCase()}`);
    for (const pageInfo of pages) {
      const result = await captureScreenshot(
        darkPage,
        pageInfo.path,
        pageInfo.name,
        'dark'
      );
      results.push(result);
    }
  }

  await darkBrowser.close();

  // Generate summary report
  console.log('\n📊 SCREENSHOT CAPTURE SUMMARY');
  console.log('=' .repeat(60));

  const totalPages = Object.values(PAGES).flat().length;
  const totalScreenshots = totalPages * 2; // light + dark
  const successfulScreenshots = results.filter((r) => r.success).length;

  console.log(`Total pages tested: ${totalPages}`);
  console.log(`Total screenshots expected: ${totalScreenshots}`);
  console.log(`Successful screenshots: ${successfulScreenshots}`);
  console.log(`Failed screenshots: ${totalScreenshots - successfulScreenshots}`);

  // Save detailed results to JSON
  const resultsPath = path.join(SCREENSHOT_DIR, 'screenshot-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed results saved to: ${resultsPath}`);

  // Show pages with errors
  const pagesWithErrors = results.filter(
    (r) => r.consoleErrors.length > 0 || r.networkErrors.length > 0
  );

  if (pagesWithErrors.length > 0) {
    console.log('\n⚠️  PAGES WITH ERRORS/WARNINGS:');
    pagesWithErrors.forEach((r) => {
      console.log(`\n${r.page} (${r.theme}):`);
      if (r.consoleErrors.length > 0) {
        console.log('  Console Errors:');
        r.consoleErrors.forEach((err) => console.log(`    - ${err}`));
      }
      if (r.networkErrors.length > 0) {
        console.log('  Network Errors:');
        r.networkErrors.forEach((err) => console.log(`    - ${err}`));
      }
    });
  }

  console.log('\n✅ Screenshot capture complete!');
}

// Run the script
captureAllScreenshots().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
