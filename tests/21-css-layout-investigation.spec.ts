import { test, expect, Page } from '@playwright/test';
import { login } from './helpers/auth-helper';

/**
 * CSS Layout Investigation
 *
 * Purpose: Investigate the CSS layout bug on Financial Dashboard
 * where "Top Customers by Revenue" table shows vertical text stacking
 */

test.describe('CSS Layout Investigation - Financial Dashboard', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // Login as admin user
    await login(page, 'admin@test.com', 'password');
    await page.goto('/dashboards/financial');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('Investigate Top Customers by Revenue layout', async () => {
    console.log('\n🔍 CSS LAYOUT INVESTIGATION - Financial Dashboard');
    console.log('=' .repeat(80));

    // 1. Check if customer list exists
    const customerList = page.locator('.customer-list');
    await expect(customerList).toBeVisible();
    console.log('✅ Found .customer-list element');

    // 2. Check customer list styles
    const listStyles = await customerList.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        flexDirection: computed.flexDirection,
        gap: computed.gap
      };
    });
    console.log('\n📊 .customer-list styles:', JSON.stringify(listStyles, null, 2));

    // 3. Check customer list items
    const customerItems = page.locator('.customer-list-item');
    const itemCount = await customerItems.count();
    console.log(`\n📝 Found ${itemCount} customer list items`);

    if (itemCount > 0) {
      // Check first item's layout
      const firstItem = customerItems.first();
      const itemStyles = await firstItem.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          display: computed.display,
          flexDirection: computed.flexDirection,
          alignItems: computed.alignItems,
          justifyContent: computed.justifyContent,
          padding: computed.padding,
          width: computed.width
        };
      });
      console.log('\n📊 .customer-list-item styles:', JSON.stringify(itemStyles, null, 2));

      // 4. Check customer-rank section
      const customerRank = firstItem.locator('.customer-rank');
      if (await customerRank.count() > 0) {
        const rankStyles = await customerRank.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            display: computed.display,
            flexDirection: computed.flexDirection,
            alignItems: computed.alignItems,
            gap: computed.gap
          };
        });
        console.log('\n📊 .customer-rank styles:', JSON.stringify(rankStyles, null, 2));
      }

      // 5. Check customer-info section
      const customerInfo = firstItem.locator('.customer-info');
      if (await customerInfo.count() > 0) {
        const infoStyles = await customerInfo.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            display: computed.display,
            flexDirection: computed.flexDirection
          };
        });
        console.log('\n📊 .customer-info styles:', JSON.stringify(infoStyles, null, 2));

        // Check customer name
        const customerName = customerInfo.locator('.customer-name');
        if (await customerName.count() > 0) {
          const nameStyles = await customerName.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
              display: computed.display,
              writingMode: computed.writingMode,
              textOrientation: computed.textOrientation,
              whiteSpace: computed.whiteSpace,
              width: computed.width
            };
          });
          console.log('\n📊 .customer-name styles:', JSON.stringify(nameStyles, null, 2));
        }

        // Check customer ID
        const customerId = customerInfo.locator('.customer-id');
        if (await customerId.count() > 0) {
          const idStyles = await customerId.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
              display: computed.display,
              writingMode: computed.writingMode,
              fontSize: computed.fontSize,
              color: computed.color
            };
          });
          console.log('\n📊 .customer-id styles:', JSON.stringify(idStyles, null, 2));
        }
      }

      // 6. Check customer-revenue section
      const customerRevenue = firstItem.locator('.customer-revenue');
      if (await customerRevenue.count() > 0) {
        const revenueStyles = await customerRevenue.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            display: computed.display,
            textAlign: computed.textAlign
          };
        });
        console.log('\n📊 .customer-revenue styles:', JSON.stringify(revenueStyles, null, 2));

        // Check revenue amount
        const revenueAmount = customerRevenue.locator('.customer-revenue-amount');
        if (await revenueAmount.count() > 0) {
          const amountStyles = await revenueAmount.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
              display: computed.display,
              writingMode: computed.writingMode,
              fontWeight: computed.fontWeight,
              fontSize: computed.fontSize
            };
          });
          console.log('\n📊 .customer-revenue-amount styles:', JSON.stringify(amountStyles, null, 2));
        }
      }

      // 7. Take screenshot for visual inspection
      await page.screenshot({
        path: 'tests/screenshots/financial-dashboard-top-customers-investigation.png',
        fullPage: false
      });
      console.log('\n📸 Screenshot saved: tests/screenshots/financial-dashboard-top-customers-investigation.png');

      // 8. Get actual text content to verify rendering
      const firstCustomerName = await firstItem.locator('.customer-name').textContent();
      const firstCustomerId = await firstItem.locator('.customer-id').textContent();
      const firstRevenue = await firstItem.locator('.customer-revenue-amount').textContent();

      console.log('\n📝 First Customer Data:');
      console.log(`   Name: ${firstCustomerName}`);
      console.log(`   ID: ${firstCustomerId}`);
      console.log(`   Revenue: ${firstRevenue}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('🔍 INVESTIGATION COMPLETE\n');
  });

  test('Check for conflicting CSS media queries', async () => {
    console.log('\n🔍 CHECKING MEDIA QUERY EFFECTS');
    console.log('=' .repeat(80));

    // Test at different viewport sizes to see if media queries break layout
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500); // Let CSS settle

      const customerItems = page.locator('.customer-list-item');
      const itemCount = await customerItems.count();

      if (itemCount > 0) {
        const firstItem = customerItems.first();
        const itemStyles = await firstItem.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            display: computed.display,
            flexDirection: computed.flexDirection,
            width: computed.width
          };
        });

        console.log(`\n📱 ${viewport.name} (${viewport.width}x${viewport.height})`);
        console.log(`   .customer-list-item styles: ${JSON.stringify(itemStyles)}`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('🔍 MEDIA QUERY CHECK COMPLETE\n');
  });

  test('Verify text is NOT vertically oriented', async () => {
    const customerList = page.locator('.customer-list');
    await expect(customerList).toBeVisible();

    const customerItems = page.locator('.customer-list-item');
    const itemCount = await customerItems.count();

    if (itemCount > 0) {
      const firstItem = customerItems.first();

      // Check all text elements for vertical writing modes
      const textElements = [
        { selector: '.customer-name', label: 'Customer Name' },
        { selector: '.customer-id', label: 'Customer ID' },
        { selector: '.customer-revenue-amount', label: 'Revenue Amount' },
        { selector: '.customer-revenue-label', label: 'Revenue Label' }
      ];

      for (const element of textElements) {
        const el = firstItem.locator(element.selector);
        if (await el.count() > 0) {
          const styles = await el.evaluate((node) => {
            const computed = window.getComputedStyle(node);
            return {
              writingMode: computed.writingMode,
              textOrientation: computed.textOrientation
            };
          });

          console.log(`\n${element.label}:`);
          console.log(`   writing-mode: ${styles.writingMode}`);
          console.log(`   text-orientation: ${styles.textOrientation}`);

          // Assert horizontal text
          expect(styles.writingMode).toBe('horizontal-tb');
        }
      }
    }
  });

  test('Verify layout is horizontal (flex-direction: row)', async () => {
    const customerList = page.locator('.customer-list');
    await expect(customerList).toBeVisible();

    const customerItems = page.locator('.customer-list-item');
    const itemCount = await customerItems.count();

    if (itemCount > 0) {
      const firstItem = customerItems.first();

      // .customer-list-item should be flex with justify-content: space-between (horizontal)
      const itemStyles = await firstItem.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          display: computed.display,
          flexDirection: computed.flexDirection,
          justifyContent: computed.justifyContent
        };
      });

      expect(itemStyles.display).toBe('flex');
      expect(itemStyles.flexDirection).not.toBe('column'); // Should NOT be column
      expect(itemStyles.justifyContent).toBe('space-between');

      // .customer-rank should be flex row
      const rankStyles = await firstItem.locator('.customer-rank').evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          display: computed.display,
          flexDirection: computed.flexDirection
        };
      });

      expect(rankStyles.display).toBe('flex');
      expect(rankStyles.flexDirection).not.toBe('column'); // Should NOT be column (should be 'row' or default)
    }
  });
});

// Helper function to get all applied CSS rules for an element
async function getAppliedStyles(page: Page, selector: string): Promise<string[]> {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return [];

    const sheets = Array.from(document.styleSheets);
    const appliedRules: string[] = [];

    sheets.forEach((sheet) => {
      try {
        const rules = Array.from(sheet.cssRules || []);
        rules.forEach((rule) => {
          if (rule instanceof CSSStyleRule) {
            if (element.matches(rule.selectorText)) {
              appliedRules.push(`${rule.selectorText} { ${rule.style.cssText} }`);
            }
          }
        });
      } catch (e) {
        // Cross-origin stylesheet, skip
      }
    });

    return appliedRules;
  }, selector);
}
