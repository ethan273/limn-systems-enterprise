import { test, expect } from '@playwright/test';
import { login } from './helpers/auth-helper';

/**
 * Verify icon placement on Manufacturing/Design/Quality/Partners dashboards
 * Icons should be aligned horizontally with their titles in insights sections
 */

test.describe('Dashboard Icon Placement', () => {
  const dashboards = [
    { name: 'Manufacturing', path: '/dashboards/manufacturing' },
    { name: 'Design', path: '/dashboards/design' },
    { name: 'Quality', path: '/dashboards/quality' },
    { name: 'Partners', path: '/dashboards/partners' },
  ];

  for (const dashboard of dashboards) {
    test(`${dashboard.name} Dashboard - Icons aligned with titles`, async ({ page }) => {
      await login(page, 'admin@test.com', 'password');
      await page.goto(dashboard.path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Check if insights section exists
      const insightsSection = page.locator('.insights-grid');
      if (await insightsSection.count() === 0) {
        console.log(`⚠️ No insights section found on ${dashboard.name} Dashboard`);
        return;
      }

      // Check .insight-header flex layout
      const insightHeaders = page.locator('.insight-header');
      const count = await insightHeaders.count();

      if (count === 0) {
        console.log(`⚠️ No .insight-header elements found on ${dashboard.name} Dashboard`);
        return;
      }

      console.log(`Found ${count} insight headers on ${dashboard.name} Dashboard`);

      // Verify first insight header has correct flex layout
      const firstHeader = insightHeaders.first();
      const display = await firstHeader.evaluate(el => getComputedStyle(el).display);
      const alignItems = await firstHeader.evaluate(el => getComputedStyle(el).alignItems);
      const gap = await firstHeader.evaluate(el => getComputedStyle(el).gap);

      console.log(`First insight header CSS:`, { display, alignItems, gap });

      expect(display).toBe('flex');
      expect(alignItems).toBe('center');

      // Verify icon exists and is properly sized
      const icon = firstHeader.locator('.insight-icon').first();
      if (await icon.count() > 0) {
        const iconWidth = await icon.evaluate(el => getComputedStyle(el).width);
        const iconHeight = await icon.evaluate(el => getComputedStyle(el).height);
        console.log(`Icon size:`, { iconWidth, iconHeight });

        expect(iconWidth).toBe('40px'); // 2.5rem
        expect(iconHeight).toBe('40px'); // 2.5rem
      }

      // Take screenshot
      await page.screenshot({
        path: `tests/screenshots/${dashboard.name.toLowerCase()}-dashboard-icons.png`,
        fullPage: true
      });

      console.log(`✅ Screenshot saved: tests/screenshots/${dashboard.name.toLowerCase()}-dashboard-icons.png`);
    });
  }
});
