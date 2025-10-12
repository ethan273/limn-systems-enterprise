/**
 * FUNCTIONAL TEST: Remaining Modules
 *
 * Quick verification test for:
 * - Design (Projects, Boards, Briefs)
 * - Shipping (Shipments)
 * - Tasks
 * - Partners (Designers, Factories)
 * - Products (Catalog)
 */

import { test } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { login } from './helpers/auth-helper';

const prisma = new PrismaClient();

const issues: Array<{
  module: string;
  page: string;
  issue: string;
}> = [];

function checkTable(module: string, page: string, hasTable: boolean) {
  if (!hasTable) {
    issues.push({ module, page, issue: 'No table found' });
    console.log(`   ❌ ${module}: No table`);
  } else {
    console.log(`   ✅ ${module}: Table found`);
  }
}

test.describe('Remaining Modules - Quick Functional Test', () => {
  test.beforeAll(() => {
    console.log('\n🧪 Testing Remaining Modules');
  });

  test.afterAll(async () => {
    console.log('\n' + '='.repeat(80));
    console.log(`📊 REMAINING MODULES: ${issues.length} TABLE ISSUES FOUND`);
    issues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue.module} (${issue.page}): ${issue.issue}`);
    });
    console.log('='.repeat(80));
    await prisma.$disconnect();
  });

  test('Design Module - All Pages', async ({ page }) => {
    await login(page, 'dev-user@limn.us.com', 'password');

    // Design Projects
    await page.goto('/design/projects');
    const projectsTable = await page.locator('table').first().count();
    checkTable('Design Projects', '/design/projects', projectsTable > 0);

    // Design Boards
    await page.goto('/design/boards');
    const boardsTable = await page.locator('table').first().count();
    checkTable('Design Boards', '/design/boards', boardsTable > 0);

    // Design Briefs
    await page.goto('/design/briefs');
    const briefsTable = await page.locator('table').first().count();
    checkTable('Design Briefs', '/design/briefs', briefsTable > 0);
  });

  test('Shipping Module', async ({ page }) => {
    await login(page, 'dev-user@limn.us.com', 'password');

    await page.goto('/shipping/shipments');
    const table = await page.locator('table').first().count();
    checkTable('Shipping', '/shipping/shipments', table > 0);
  });

  test('Tasks Module', async ({ page }) => {
    await login(page, 'dev-user@limn.us.com', 'password');

    await page.goto('/tasks');
    const table = await page.locator('table').first().count();
    checkTable('Tasks', '/tasks', table > 0);
  });

  test('Partners Module', async ({ page }) => {
    await login(page, 'dev-user@limn.us.com', 'password');

    // Designers
    await page.goto('/partners/designers');
    const designersTable = await page.locator('table').first().count();
    checkTable('Designers', '/partners/designers', designersTable > 0);

    // Factories
    await page.goto('/partners/factories');
    const factoriesTable = await page.locator('table').first().count();
    checkTable('Factories', '/partners/factories', factoriesTable > 0);
  });

  test('Products Module', async ({ page }) => {
    await login(page, 'dev-user@limn.us.com', 'password');

    await page.goto('/products/catalog');
    const table = await page.locator('table').first().count();
    checkTable('Products', '/products/catalog', table > 0);
  });
});
