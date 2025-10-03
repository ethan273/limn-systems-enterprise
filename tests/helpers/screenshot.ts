/**
 * Screenshot Helper Utilities
 *
 * Consistent screenshot capture with automatic organization
 * Created: October 3, 2025
 */

import { Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Takes a screenshot and saves it with organized naming
 */
export async function takeScreenshot(
  page: Page,
  name: string,
  options?: {
    fullPage?: boolean;
    module?: string;
  }
): Promise<void> {
  const { fullPage = false, module = 'general' } = options || {};

  // Create screenshots directory structure
  const screenshotsDir = path.join(process.cwd(), 'screenshots', module);
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  const filepath = path.join(screenshotsDir, filename);

  // Take screenshot
  await page.screenshot({
    path: filepath,
    fullPage,
  });

  console.log(`📸 Screenshot saved: ${filepath}`);
}

/**
 * Checks for console errors on the page
 */
export async function checkConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Wait a moment for any console messages
  await page.waitForTimeout(500);

  return errors;
}

/**
 * Checks for failed network requests
 */
export async function checkNetworkErrors(page: Page): Promise<Array<{
  url: string;
  status: number;
}>> {
  const networkErrors: Array<{ url: string; status: number }> = [];

  page.on('response', (response) => {
    if (response.status() >= 400) {
      networkErrors.push({
        url: response.url(),
        status: response.status(),
      });
    }
  });

  return networkErrors;
}

/**
 * Waits for page to be fully loaded (no network activity)
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}
