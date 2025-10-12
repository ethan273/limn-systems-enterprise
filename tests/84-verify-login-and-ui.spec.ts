/**
 * VERIFICATION TEST: Are we logged in? What UI patterns are actually on pages?
 */

import { test } from '@playwright/test';
import { login } from './helpers/auth-helper';

test.describe('Verify Login and UI Patterns', () => {
  test('Check what Contacts page actually looks like', async ({ page }) => {
    console.log('\n🔍 VERIFYING: What does /crm/contacts actually render?');

    await login(page, 'dev-user@limn.us.com', 'password');
    await page.goto('/crm/contacts');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({
      path: '/Users/eko3/limn-systems-enterprise-docs/02-TESTING/test-results/contacts-page-actual.png',
      fullPage: true
    });

    // Get page HTML structure
    const bodyHTML = await page.locator('body').innerHTML();

    // Check for different UI patterns
    const hasTable = await page.locator('table').count();
    const hasCards = await page.locator('[class*="card"]').count();
    const hasGrid = await page.locator('[class*="grid"]').count();
    const hasList = await page.locator('ul, ol').count();

    console.log('\n📊 Page Analysis:');
    console.log(`   URL: ${page.url()}`);
    console.log(`   Tables found: ${hasTable}`);
    console.log(`   Cards found: ${hasCards}`);
    console.log(`   Grids found: ${hasGrid}`);
    console.log(`   Lists found: ${hasList}`);

    // Check for common elements
    const hasButton = await page.locator('button').count();
    const hasInput = await page.locator('input').count();
    const hasH1 = await page.locator('h1').count();

    console.log(`\n   Buttons: ${hasButton}`);
    console.log(`   Inputs: ${hasInput}`);
    console.log(`   H1 tags: ${hasH1}`);

    // Get all button text
    if (hasButton > 0) {
      const buttonTexts = await page.locator('button').allTextContents();
      console.log(`\n   Button texts: ${JSON.stringify(buttonTexts.slice(0, 10))}`);
    }

    // Check if we're redirected to login
    if (page.url().includes('/login')) {
      console.log('\n   ⚠️  WARNING: Page redirected to /login - Not authenticated!');
    }

    // Get page title
    const title = await page.title();
    console.log(`\n   Page title: ${title}`);
  });

  test('Check what Invoices page actually looks like', async ({ page }) => {
    console.log('\n🔍 VERIFYING: What does /financials/invoices actually render?');

    await login(page, 'dev-user@limn.us.com', 'password');
    await page.goto('/financials/invoices');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: '/Users/eko3/limn-systems-enterprise-docs/02-TESTING/test-results/invoices-page-actual.png',
      fullPage: true
    });

    const hasTable = await page.locator('table').count();
    const hasCards = await page.locator('[class*="card"]').count();
    const hasButton = await page.locator('button').count();

    console.log(`\n   URL: ${page.url()}`);
    console.log(`   Tables: ${hasTable}`);
    console.log(`   Cards: ${hasCards}`);
    console.log(`   Buttons: ${hasButton}`);

    if (hasButton > 0) {
      const buttonTexts = await page.locator('button').allTextContents();
      console.log(`   Button texts: ${JSON.stringify(buttonTexts.slice(0, 10))}`);
    }
  });
});
