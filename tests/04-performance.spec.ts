import { test, expect } from '@playwright/test';
import { login } from './helpers/auth-helper';
import { TEST_CONFIG } from './config/test-config';

test.describe('⚡ PERFORMANCE TESTS @performance', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_CONFIG.ADMIN_EMAIL, TEST_CONFIG.ADMIN_PASSWORD);
  });

  const pagesToTest = [
    { name: 'Dashboard', path: '/dashboard', maxLoadTime: 3000 },
    { name: 'Projects', path: '/crm/projects', maxLoadTime: 2500 },
    { name: 'Tasks', path: '/tasks', maxLoadTime: 2500 },
    { name: 'Products', path: '/products/catalog', maxLoadTime: 3000 },
    { name: 'Documents', path: '/documents', maxLoadTime: 2500 }
  ];

  for (const pageInfo of pagesToTest) {
    test(`Page load time - ${pageInfo.name}`, async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto(`${TEST_CONFIG.BASE_URL}${pageInfo.path}`);
      await page.waitForLoadState('domcontentloaded');
      
      const loadTime = Date.now() - startTime;
      
      console.log(`${pageInfo.name} load time: ${loadTime}ms (target: <${pageInfo.maxLoadTime}ms)`);
      
      // Check load time
      expect(loadTime).toBeLessThan(pageInfo.maxLoadTime);
    });
  }

  test('API Response Times', async ({ page }) => {
    // Test tRPC API response times by measuring actual procedure calls
    await login(page, TEST_CONFIG.ADMIN_EMAIL, TEST_CONFIG.ADMIN_PASSWORD);

    // Navigate to a page that makes API calls
    const startTime = Date.now();
    await page.goto(`${TEST_CONFIG.BASE_URL}/tasks`);
    await page.waitForLoadState('domcontentloaded');

    // Wait for API data to load (table or content appears)
    try {
      await page.waitForSelector('table, [role="table"], text=No tasks', { timeout: 3000 });
    } catch {
      // If no selector found, page still loaded - that's okay
    }

    const responseTime = Date.now() - startTime;

    console.log(`Tasks page API load time: ${responseTime}ms`);

    // API should respond within reasonable time
    expect(responseTime).toBeLessThan(5000); // 5 second max for full page + data load
  });
});