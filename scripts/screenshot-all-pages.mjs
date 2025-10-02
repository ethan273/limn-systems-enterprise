#!/usr/bin/env node

import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { join } from 'path';

const PAGES = [
  '/login',
  '/auth/employee',
  '/dashboard',
  '/crm/projects',
  '/crm/clients',
  '/crm/leads',
  '/crm/prospects',
  '/crm/contacts',
  '/products/materials',
  '/products/catalog',
  '/products/prototypes',
  '/products/concepts',
  '/products/ordered-items',
  '/products/collections',
  '/production/dashboard',
  '/production/orders',
  '/production/qc',
  '/production/packing',
  '/tasks',
  '/tasks/my',
  '/tasks/kanban',
  '/design/boards',
  '/design/projects',
  '/portal',
  '/portal/shipping',
];

async function screenshotPages() {
  const browser = await chromium.launch();
  const screenshotDir = join(process.cwd(), 'screenshots');

  // Create screenshots directory
  await mkdir(screenshotDir, { recursive: true });
  await mkdir(join(screenshotDir, 'light'), { recursive: true });
  await mkdir(join(screenshotDir, 'dark'), { recursive: true });

  console.log('📸 Starting screenshot capture...\n');

  // Light mode screenshots
  console.log('☀️  Light Mode Screenshots:');
  const lightContext = await browser.newContext({
    colorScheme: 'light',
    viewport: { width: 1920, height: 1080 }
  });
  const lightPage = await lightContext.newPage();

  for (const pagePath of PAGES) {
    try {
      const url = `http://localhost:3000${pagePath}`;
      await lightPage.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
      await lightPage.waitForTimeout(1000); // Wait for any animations

      const filename = pagePath.replace(/\//g, '_').slice(1) || 'home';
      await lightPage.screenshot({
        path: join(screenshotDir, 'light', `${filename}.png`),
        fullPage: true
      });
      console.log(`  ✅ ${pagePath}`);
    } catch (error) {
      console.log(`  ❌ ${pagePath} - ${error.message}`);
    }
  }

  await lightContext.close();

  // Dark mode screenshots
  console.log('\n🌙 Dark Mode Screenshots:');
  const darkContext = await browser.newContext({
    colorScheme: 'dark',
    viewport: { width: 1920, height: 1080 }
  });
  const darkPage = await darkContext.newPage();

  for (const pagePath of PAGES) {
    try {
      const url = `http://localhost:3000${pagePath}`;
      await darkPage.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
      await darkPage.waitForTimeout(1000);

      const filename = pagePath.replace(/\//g, '_').slice(1) || 'home';
      await darkPage.screenshot({
        path: join(screenshotDir, 'dark', `${filename}.png`),
        fullPage: true
      });
      console.log(`  ✅ ${pagePath}`);
    } catch (error) {
      console.log(`  ❌ ${pagePath} - ${error.message}`);
    }
  }

  await darkContext.close();
  await browser.close();

  console.log('\n✅ Screenshot capture complete!');
  console.log(`📁 Screenshots saved to: ${screenshotDir}`);
}

screenshotPages().catch(console.error);
