#!/usr/bin/env node

import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { join } from 'path';

const TEST_PAGES = [
  '/login',
  '/products/materials',
  '/crm/projects',
  '/tasks',
];

async function verifyFixes() {
  const browser = await chromium.launch();
  const screenshotDir = join(process.cwd(), 'screenshots/fixed');

  await mkdir(join(screenshotDir, 'light'), { recursive: true });
  await mkdir(join(screenshotDir, 'dark'), { recursive: true });

  console.log('📸 Verifying contrast fixes...\n');

  // Light mode
  console.log('☀️  Light Mode:');
  const lightContext = await browser.newContext({
    colorScheme: 'light',
    viewport: { width: 1920, height: 1080 }
  });
  const lightPage = await lightContext.newPage();

  for (const pagePath of TEST_PAGES) {
    try {
      await lightPage.goto(`http://localhost:3000${pagePath}`, { waitUntil: 'networkidle', timeout: 10000 });
      await lightPage.waitForTimeout(1000);
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

  // Dark mode
  console.log('\n🌙 Dark Mode:');
  const darkContext = await browser.newContext({
    colorScheme: 'dark',
    viewport: { width: 1920, height: 1080 }
  });
  const darkPage = await darkContext.newPage();

  for (const pagePath of TEST_PAGES) {
    try {
      await darkPage.goto(`http://localhost:3000${pagePath}`, { waitUntil: 'networkidle', timeout: 10000 });
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

  console.log('\n✅ Verification complete!');
  console.log(`📁 Fixed screenshots: ${screenshotDir}`);
}

verifyFixes().catch(console.error);
