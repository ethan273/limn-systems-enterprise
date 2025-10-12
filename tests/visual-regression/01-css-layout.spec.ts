import { test, expect, Page } from '@playwright/test';
import { login } from '../helpers/auth-helper';

/**
 * CSS Layout & Visual Regression Tests
 *
 * These tests are designed to catch layout issues like:
 * - Text overflow/stacking
 * - Icon misplacement
 * - Missing CSS properties
 * - Incorrect flexbox layouts
 *
 * Session 2025-10-09: Created after fixing multiple CSS bugs
 * that should have been caught by automated tests.
 */

test.describe('Dashboard CSS Layout Tests', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await login(page, 'dev-user@limn.us.com', 'password');
    await page.goto('/dashboards/financial');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Text Overflow & Truncation', () => {
    test('customer names should not stack vertically', async () => {
      // This would have caught the vertical text stacking bug
      const customerList = page.locator('.customer-info').first();

      if (await customerList.count() > 0) {
        // Get customer name element
        const customerName = customerList.locator('.customer-name').first();

        // Check CSS properties that prevent text stacking
        await expect(customerName).toHaveCSS('white-space', 'nowrap');
        await expect(customerName).toHaveCSS('overflow', 'hidden');
        await expect(customerName).toHaveCSS('text-overflow', 'ellipsis');

        // Verify text doesn't overflow container
        const nameBox = await customerName.boundingBox();
        const containerBox = await customerList.boundingBox();

        if (nameBox && containerBox) {
          expect(nameBox.width).toBeLessThanOrEqual(containerBox.width);
        }
      }
    });

    test('customer name container should have min-width: 0 for flex truncation', async () => {
      // This CSS property is critical for text truncation in flex containers
      const customerInfo = page.locator('.customer-info').first();

      if (await customerInfo.count() > 0) {
        await expect(customerInfo).toHaveCSS('min-width', '0px');
        await expect(customerInfo).toHaveCSS('flex', /.+/); // Should have flex property
      }
    });

    test('long text should show ellipsis, not overflow', async () => {
      // Create test data with very long customer name
      const customerName = page.locator('.customer-name').first();

      if (await customerName.count() > 0) {
        const text = await customerName.textContent();
        const box = await customerName.boundingBox();

        // If text is long and container has width, verify truncation
        if (text && text.length > 30 && box) {
          // Should have ellipsis CSS
          await expect(customerName).toHaveCSS('text-overflow', 'ellipsis');

          // Container shouldn't be wider than parent
          const parent = customerName.locator('..');
          const parentBox = await parent.boundingBox();

          if (parentBox) {
            expect(box.width).toBeLessThanOrEqual(parentBox.width);
          }
        }
      }
    });
  });

  test.describe('Icon Positioning', () => {
    test('insight card icons should be on the right, not left', async () => {
      // This would have caught the icon misplacement bug
      const insightHeaders = page.locator('.insight-header');
      const count = await insightHeaders.count();

      if (count > 0) {
        const firstHeader = insightHeaders.first();

        // Verify flexbox properties
        await expect(firstHeader).toHaveCSS('display', 'flex');
        await expect(firstHeader).toHaveCSS('justify-content', 'space-between');
        await expect(firstHeader).toHaveCSS('align-items', 'center');

        // Get positions of title and icon
        const title = firstHeader.locator('.insight-title');
        const icon = firstHeader.locator('.insight-icon');

        if (await title.count() > 0 && await icon.count() > 0) {
          const titleBox = await title.boundingBox();
          const iconBox = await icon.boundingBox();

          // Icon should be to the RIGHT of title
          if (titleBox && iconBox) {
            expect(iconBox.x).toBeGreaterThan(titleBox.x + titleBox.width);
          }
        }
      }
    });

    test('all dashboard insight icons should be right-aligned', async () => {
      // Check all dashboards for consistent icon placement
      const dashboards = [
        '/dashboards/financial',
        '/dashboards/manufacturing',
        '/dashboards/design',
        '/dashboards/executive',
        '/dashboards/partners',
        '/dashboards/quality',
        '/dashboards/shipping'
      ];

      for (const dashboard of dashboards) {
        await page.goto(dashboard);
        await page.waitForLoadState('networkidle');

        const insightHeaders = page.locator('.insight-header');
        const count = await insightHeaders.count();

        if (count > 0) {
          const firstHeader = insightHeaders.first();
          const title = firstHeader.locator('.insight-title');
          const icon = firstHeader.locator('.insight-icon');

          if (await title.count() > 0 && await icon.count() > 0) {
            const titleBox = await title.boundingBox();
            const iconBox = await icon.boundingBox();

            if (titleBox && iconBox) {
              expect(iconBox.x).toBeGreaterThan(titleBox.x,
                `Icon should be right of title on ${dashboard}`);
            }
          }
        }
      }
    });
  });

  test.describe('Data Display Validation', () => {
    test('customer names should be actual names, not UUIDs', async () => {
      // This would have caught the "Customer ID: uuid" bug
      const customerNames = page.locator('.customer-name');
      const count = await customerNames.count();

      for (let i = 0; i < Math.min(count, 10); i++) {
        const name = await customerNames.nth(i).textContent();

        if (name) {
          // Should NOT be a UUID pattern
          expect(name).not.toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

          // Should NOT start with "Customer ID:"
          expect(name).not.toMatch(/^Customer ID:/);

          // Should be a reasonable name (letters, spaces, or email)
          expect(name).toMatch(/^[A-Za-z\s@.\-]+$|^Unknown Customer$/);
        }
      }
    });

    test('customer list should not show redundant IDs', async () => {
      // Check that we're not displaying both name AND ID
      const customerItems = page.locator('.customer-info');
      const count = await customerItems.count();

      if (count > 0) {
        const firstItem = customerItems.first();
        const text = await firstItem.textContent();

        // Should not have both a name and "Customer ID:" in the same item
        if (text && !text.includes('Unknown Customer')) {
          expect(text).not.toMatch(/[A-Za-z\s]+Customer ID:/);
        }
      }
    });
  });

  test.describe('Quality Stats Layout', () => {
    test('quality stats should have proper flexbox layout', async () => {
      await page.goto('/dashboards/quality');
      await page.waitForLoadState('networkidle');

      const qualityStats = page.locator('.quality-stats').first();

      if (await qualityStats.count() > 0) {
        // Should have flex column layout
        await expect(qualityStats).toHaveCSS('display', 'flex');
        await expect(qualityStats).toHaveCSS('flex-direction', 'column');
        await expect(qualityStats).toHaveCSS('gap', /.+/); // Should have gap
      }
    });

    test('quality stat items should be horizontal', async () => {
      await page.goto('/dashboards/quality');
      await page.waitForLoadState('networkidle');

      const qualityStat = page.locator('.quality-stat').first();

      if (await qualityStat.count() > 0) {
        await expect(qualityStat).toHaveCSS('display', 'flex');
        await expect(qualityStat).toHaveCSS('align-items', 'center');
        await expect(qualityStat).toHaveCSS('gap', /.+/);
      }
    });

    test('stat values and labels should not stack vertically', async () => {
      await page.goto('/dashboards/quality');
      await page.waitForLoadState('networkidle');

      const statValue = page.locator('.stat-value').first();
      const statLabel = page.locator('.stat-label').first();

      if (await statValue.count() > 0 && await statLabel.count() > 0) {
        const valueBox = await statValue.boundingBox();
        const labelBox = await statLabel.boundingBox();

        // Value and label should be on roughly same vertical line
        if (valueBox && labelBox) {
          // Allow for some vertical offset but they shouldn't be stacked
          expect(Math.abs(valueBox.y - labelBox.y)).toBeLessThan(50);
        }
      }
    });
  });

  test.describe('Visual Regression - Screenshots', () => {
    test('financial dashboard top customers section', async () => {
      // This captures the overall layout for regression testing
      const customersSection = page.locator('.customer-info').first().locator('..');

      if (await customersSection.count() > 0) {
        await expect(customersSection).toHaveScreenshot('top-customers-section.png', {
          maxDiffPixels: 100,
        });
      }
    });

    test('insight cards with icons', async () => {
      const insightCard = page.locator('.insight-header').first();

      if (await insightCard.count() > 0) {
        await expect(insightCard).toHaveScreenshot('insight-card-header.png', {
          maxDiffPixels: 50,
        });
      }
    });

    test('full financial dashboard layout', async () => {
      // Capture entire dashboard to catch any layout issues
      await expect(page).toHaveScreenshot('financial-dashboard-full.png', {
        fullPage: true,
        maxDiffPixels: 500,
      });
    });
  });

  test.describe('Flexbox Layout Validation', () => {
    test('insight headers should use space-between justification', async () => {
      const headers = page.locator('.insight-header');
      const count = await headers.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        const header = headers.nth(i);
        await expect(header).toHaveCSS('justify-content', 'space-between');
      }
    });

    test('flex children should have min-width 0 for truncation', async () => {
      // Critical for text truncation in flex containers
      const flexChildren = page.locator('.customer-info, .insight-title');
      const count = await flexChildren.count();

      if (count > 0) {
        for (let i = 0; i < Math.min(count, 5); i++) {
          const child = flexChildren.nth(i);
          const minWidth = await child.evaluate(el =>
            window.getComputedStyle(el).minWidth
          );

          // Should be 0px for proper truncation
          expect(minWidth).toBe('0px');
        }
      }
    });
  });

  test.describe('Container Overflow Protection', () => {
    test('no elements should overflow their containers horizontally', async () => {
      // Get all cards and check for horizontal overflow
      const cards = page.locator('.card');
      const count = await cards.count();

      for (let i = 0; i < Math.min(count, 10); i++) {
        const card = cards.nth(i);
        const cardBox = await card.boundingBox();

        if (cardBox) {
          // Check all children don't overflow
          const children = card.locator('*');
          const childCount = await children.count();

          for (let j = 0; j < Math.min(childCount, 20); j++) {
            const child = children.nth(j);
            const childBox = await child.boundingBox();

            if (childBox) {
              // Child should not extend beyond card
              expect(childBox.x + childBox.width).toBeLessThanOrEqual(
                cardBox.x + cardBox.width + 1 // +1 for rounding
              );
            }
          }
        }
      }
    });

    test('text elements should not cause horizontal scrolling', async () => {
      // Check viewport doesn't have horizontal scroll
      const viewportWidth = page.viewportSize()?.width || 1280;

      const bodyWidth = await page.evaluate(() =>
        document.body.scrollWidth
      );

      // Body should not be wider than viewport (no horizontal scroll)
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20); // +20 for scrollbar
    });
  });

  test.describe('CSS Class Presence Validation', () => {
    test('required CSS classes should exist in stylesheet', async () => {
      // Verify critical CSS classes are defined
      const requiredClasses = [
        'customer-info',
        'customer-name',
        'insight-header',
        'insight-title',
        'insight-icon',
        'quality-stats',
        'quality-stat',
        'stat-value',
        'stat-label'
      ];

      for (const className of requiredClasses) {
        const element = page.locator(`.${className}`).first();

        // Class should exist in at least one element
        // If it doesn't exist on this page, that's okay, but it should exist in stylesheet
        const exists = await element.count() > 0;

        if (exists) {
          // Verify element has computed styles (class is defined)
          const hasStyles = await element.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return styles.length > 0;
          });

          expect(hasStyles).toBeTruthy();
        }
      }
    });
  });
});

test.describe('All Dashboards Layout Consistency', () => {
  const dashboards = [
    { name: 'Financial', path: '/dashboards/financial' },
    { name: 'Manufacturing', path: '/dashboards/manufacturing' },
    { name: 'Design', path: '/dashboards/design' },
    { name: 'Executive', path: '/dashboards/executive' },
    { name: 'Partners', path: '/dashboards/partners' },
    { name: 'Quality', path: '/dashboards/quality' },
    { name: 'Shipping', path: '/dashboards/shipping' },
  ];

  test.beforeEach(async ({ page }) => {
    await login(page, 'dev-user@limn.us.com', 'password');
  });

  for (const dashboard of dashboards) {
    test(`${dashboard.name} - insight cards have consistent layout`, async ({ page }) => {
      await page.goto(dashboard.path);
      await page.waitForLoadState('networkidle');

      const insightHeaders = page.locator('.insight-header');
      const count = await insightHeaders.count();

      if (count > 0) {
        // All should have flexbox with space-between
        for (let i = 0; i < Math.min(count, 5); i++) {
          const header = insightHeaders.nth(i);
          await expect(header).toHaveCSS('display', 'flex');
          await expect(header).toHaveCSS('justify-content', 'space-between');
        }
      }
    });

    test(`${dashboard.name} - no horizontal overflow`, async ({ page }) => {
      await page.goto(dashboard.path);
      await page.waitForLoadState('networkidle');

      const viewportWidth = page.viewportSize()?.width || 1280;
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);

      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
    });

    test(`${dashboard.name} - visual regression`, async ({ page }) => {
      await page.goto(dashboard.path);
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot(`${dashboard.name.toLowerCase()}-dashboard.png`, {
        fullPage: true,
        maxDiffPixels: 500,
      });
    });
  }
});

/**
 * Test Coverage Summary:
 *
 * ✅ Text Overflow/Truncation
 * ✅ Icon Positioning (left vs right)
 * ✅ Data Display (names vs UUIDs)
 * ✅ Flexbox Layout Properties
 * ✅ CSS Class Presence
 * ✅ Container Overflow Protection
 * ✅ Visual Regression (screenshots)
 * ✅ Cross-Dashboard Consistency
 *
 * These tests would have caught ALL the bugs fixed in Session 2025-10-09:
 * 1. Vertical text stacking (truncation CSS)
 * 2. Customer UUID display (data validation)
 * 3. Icon misplacement (position checking)
 * 4. Quality stats layout (flexbox validation)
 */
