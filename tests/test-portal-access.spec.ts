import { test, expect } from '@playwright/test';

const PORTAL_USERS = [
  {
    name: 'Customer',
    email: 'test_customer@limnsystems.com',
    password: 'TestCustomer123!',
    portalType: 'customer',
    portalUrl: '/portal/customer',
  },
  {
    name: 'Designer',
    email: 'test_designer@limnsystems.com',
    password: 'TestDesigner123!',
    portalType: 'designer',
    portalUrl: '/portal/designer',
  },
  {
    name: 'Factory',
    email: 'test_factory@limnsystems.com',
    password: 'TestFactory123!',
    portalType: 'factory',
    portalUrl: '/portal/factory',
  },
  {
    name: 'QC',
    email: 'test_qc@limnsystems.com',
    password: 'TestQC123!',
    portalType: 'qc',
    portalUrl: '/portal/qc',
  },
];

test.describe('Portal Access Tests', () => {
  for (const user of PORTAL_USERS) {
    test(`${user.name} Portal - Login and Access`, async ({ page }) => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Testing ${user.name} Portal (${user.email})`);
      console.log('='.repeat(60));

      // Step 1: Navigate to portal URL (should redirect to login)
      console.log(`\n1. Navigating to ${user.portalUrl}...`);
      await page.goto(user.portalUrl);

      // Should be on login page
      await page.waitForURL(/\/portal\/login/, { timeout: 5000 });
      console.log('   ✅ Redirected to login page');

      // Step 2: Fill in credentials
      console.log(`\n2. Logging in with ${user.email}...`);
      await page.fill('input[type="email"]', user.email);
      await page.fill('input[type="password"]', user.password);

      // Take screenshot before login
      await page.screenshot({ path: `/tmp/portal-${user.portalType}-login.png` });
      console.log(`   📸 Screenshot saved: /tmp/portal-${user.portalType}-login.png`);

      // Step 3: Submit login form
      console.log('\n3. Submitting login form...');
      await page.click('button[type="submit"]');

      // Wait for navigation
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      // Step 4: Check current URL
      const currentUrl = page.url();
      console.log(`\n4. Current URL: ${currentUrl}`);

      // Take screenshot after login
      await page.screenshot({ path: `/tmp/portal-${user.portalType}-after-login.png` });
      console.log(`   📸 Screenshot saved: /tmp/portal-${user.portalType}-after-login.png`);

      // Step 5: Check for error messages
      const errorAlert = await page.locator('[role="alert"]').count();
      if (errorAlert > 0) {
        const errorText = await page.locator('[role="alert"]').textContent();
        console.log(`   ❌ Error message: ${errorText}`);
        throw new Error(`Login failed with error: ${errorText}`);
      }

      // Step 6: Verify we're on the portal page (not login)
      expect(currentUrl).not.toContain('/portal/login');
      console.log('   ✅ Not on login page anymore');

      // Step 7: Verify we're on the correct portal
      if (currentUrl.includes(user.portalUrl)) {
        console.log(`   ✅ Successfully accessed ${user.name} Portal!`);
      } else {
        console.log(`   ⚠️  On different page: ${currentUrl}`);
        console.log(`   Expected: ${user.portalUrl}`);
      }

      // Step 8: Check page content
      const pageContent = await page.content();
      console.log('\n5. Page content check:');
      console.log(`   - Contains "${user.name}": ${pageContent.toLowerCase().includes(user.name.toLowerCase())}`);
      console.log(`   - Contains "portal": ${pageContent.toLowerCase().includes('portal')}`);

      console.log(`\n${'='.repeat(60)}`);
      console.log(`✅ ${user.name} Portal Test Complete`);
      console.log('='.repeat(60));
    });
  }
});
