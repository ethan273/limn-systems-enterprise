# REALTIME TESTING GUIDE

**Date:** 2025-10-08
**Purpose:** Testing procedures for Supabase Realtime functionality

---

## OVERVIEW

This guide provides comprehensive testing procedures for realtime features, including manual tests, automated tests, and integration with the existing Playwright test suite.

---

## 1. MANUAL TESTING PROCEDURES

### Test 1: Basic Realtime Connection

**Purpose:** Verify websocket connection establishes correctly

**Steps:**
1. Open app in browser
2. Open Chrome DevTools → Console
3. Look for: `[Supabase Realtime] Connected`
4. Open Network tab → Filter: WS
5. Verify websocket connection status: **101 Switching Protocols**

**Expected Result:**
- ✅ Console shows "Connected" message
- ✅ Network tab shows active websocket
- ✅ No connection errors

---

### Test 2: Production Order Updates

**Purpose:** Verify realtime updates for production orders

**Setup:**
- Open production order list page in **Browser A**
- Open Supabase SQL Editor in **Browser B**

**Steps:**
1. **Browser A:** Navigate to `/production/orders`
2. **Browser A:** Note current order count and statuses
3. **Browser B:** Run SQL:
   ```sql
   UPDATE production_orders
   SET status = 'in_progress'
   WHERE id = (SELECT id FROM production_orders LIMIT 1);
   ```
4. **Browser A:** Watch for automatic update (no manual refresh)

**Expected Result:**
- ✅ Order status updates automatically in Browser A
- ✅ Update appears within 1-2 seconds
- ✅ No page refresh required

---

### Test 3: Multi-User Scenario

**Purpose:** Verify realtime works across multiple clients

**Setup:**
- Open same production order detail page in **3 different browsers**

**Steps:**
1. All browsers: Navigate to `/production/orders/[specific-order-id]`
2. Browser 1: Click "Update Status" and change to "completed"
3. Observe Browsers 2 and 3

**Expected Result:**
- ✅ All 3 browsers show updated status instantly
- ✅ No conflicts or race conditions
- ✅ All browsers stay in sync

---

### Test 4: Shipment Tracking Updates

**Purpose:** Verify realtime for shipments

**Steps:**
1. Open `/shipping/shipments` in Browser A
2. Create new shipment in Browser B (or via SQL)
3. Verify new shipment appears in Browser A automatically

**Expected Result:**
- ✅ New shipment appears without refresh
- ✅ Tracking number and details visible
- ✅ Stats grid updates automatically

---

### Test 5: Invoice Payment Updates

**Purpose:** Verify realtime for financial data

**Steps:**
1. Open `/financials/invoices` in Browser A
2. Record payment for an invoice in Browser B
3. Verify invoice status and balance update in Browser A

**Expected Result:**
- ✅ Invoice status changes to "paid" or "partial"
- ✅ Balance updates automatically
- ✅ Stats grid reflects new totals

---

### Test 6: Quality Inspection Updates

**Purpose:** Verify realtime for QC inspections

**Steps:**
1. Open `/production/qc` in Browser A
2. Create or update inspection in Browser B
3. Verify inspection list updates in Browser A

**Expected Result:**
- ✅ New inspections appear automatically
- ✅ Status changes reflect instantly
- ✅ Defect counts update

---

### Test 7: Notification Bell

**Purpose:** Verify realtime notifications

**Steps:**
1. Open app with notification dropdown visible
2. Insert new notification via SQL:
   ```sql
   INSERT INTO notifications (user_id, title, message, created_at)
   VALUES ('your-user-id', 'Test Notification', 'This is a test', NOW());
   ```
3. Watch notification bell badge

**Expected Result:**
- ✅ Bell badge increments automatically
- ✅ New notification appears in dropdown
- ✅ No page refresh required

---

### Test 8: Network Reconnection

**Purpose:** Verify realtime recovers from network issues

**Steps:**
1. Open any page with realtime subscriptions
2. Open Chrome DevTools → Network tab
3. Set Network throttling to "Offline"
4. Wait 5 seconds
5. Set back to "No throttling"
6. Make a database change

**Expected Result:**
- ✅ Websocket reconnects automatically
- ✅ Updates resume after reconnection
- ✅ No permanent connection loss

---

### Test 9: Memory Leak Test

**Purpose:** Verify no memory leaks over time

**Steps:**
1. Open `/production/orders`
2. Open Chrome DevTools → Memory tab
3. Take heap snapshot (Snapshot 1)
4. Navigate between pages with realtime for 10 minutes
5. Return to `/production/orders`
6. Take heap snapshot (Snapshot 2)
7. Compare snapshots

**Expected Result:**
- ✅ Memory usage stays relatively stable
- ✅ No continuous growth in snapshot size
- ✅ Detached DOM nodes don't accumulate

---

### Test 10: Cleanup on Navigation

**Purpose:** Verify subscriptions clean up properly

**Steps:**
1. Open `/production/orders` → Check Network tab (1 websocket)
2. Navigate to `/shipping/shipments` → Still 1 websocket
3. Navigate to `/financials/invoices` → Still 1 websocket
4. Close tab → Wait 5 seconds
5. Check Supabase dashboard → Realtime connections

**Expected Result:**
- ✅ Always exactly 1 websocket connection
- ✅ Connection closes when tab closes
- ✅ No zombie connections in Supabase dashboard

---

## 2. AUTOMATED PLAYWRIGHT TESTS

### Create Realtime Test File

**File:** `/tests/21-realtime-functionality.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { supabase } from './helpers/supabase-admin';

test.describe('Realtime Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    // Login as admin/test user
    await page.fill('input[type="email"]', 'admin@limnsystems.com');
    await page.fill('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should receive realtime updates for production orders', async ({ page, context }) => {
    // Open production orders page
    await page.goto('http://localhost:3000/production/orders');
    await page.waitForSelector('[data-testid="orders-table"]');

    // Get initial order count
    const initialRows = await page.locator('tr[data-row]').count();

    // Create new order via database (simulating another user)
    const { data: newOrder } = await supabase
      .from('production_orders')
      .insert({
        order_number: `TEST-${Date.now()}`,
        item_name: 'Test Item',
        quantity: 10,
        unit_price: 100,
        total_cost: 1000,
        status: 'pending',
      })
      .select()
      .single();

    // Wait for realtime update (max 3 seconds)
    await page.waitForTimeout(3000);

    // Verify new order appears without refresh
    const updatedRows = await page.locator('tr[data-row]').count();
    expect(updatedRows).toBe(initialRows + 1);

    // Cleanup
    if (newOrder) {
      await supabase.from('production_orders').delete().eq('id', newOrder.id);
    }
  });

  test('should update order status in realtime', async ({ page }) => {
    // Get an existing order
    const { data: orders } = await supabase
      .from('production_orders')
      .select('*')
      .limit(1);

    if (!orders || orders.length === 0) {
      test.skip();
      return;
    }

    const testOrder = orders[0];

    // Open order detail page
    await page.goto(`http://localhost:3000/production/orders/${testOrder.id}`);
    await page.waitForSelector('h1:has-text("' + testOrder.order_number + '")');

    // Get current status
    const statusBadge = page.locator('[data-testid="order-status"]');
    const initialStatus = await statusBadge.textContent();

    // Update status via database
    const newStatus = initialStatus?.includes('pending') ? 'in_progress' : 'pending';
    await supabase
      .from('production_orders')
      .update({ status: newStatus })
      .eq('id', testOrder.id);

    // Wait for realtime update
    await page.waitForTimeout(2000);

    // Verify status changed without refresh
    const updatedStatus = await statusBadge.textContent();
    expect(updatedStatus?.toLowerCase()).toContain(newStatus.replace('_', ' '));

    // Restore original status
    await supabase
      .from('production_orders')
      .update({ status: testOrder.status })
      .eq('id', testOrder.id);
  });

  test('should show new notification in realtime', async ({ page }) => {
    // Open app with notification bell
    await page.goto('http://localhost:3000/dashboard');

    // Get current unread count
    const bell = page.locator('[aria-label*="Open notifications"]');
    const initialBadge = await bell.locator('.notification-badge').textContent().catch(() => '0');
    const initialCount = parseInt(initialBadge || '0');

    // Create new notification via database
    const { data: newNotif } = await supabase
      .from('notifications')
      .insert({
        user_id: 'admin-user-id', // Replace with actual test user ID
        title: 'Test Notification',
        message: 'This is a realtime test',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    // Wait for realtime update
    await page.waitForTimeout(2000);

    // Verify badge incremented
    const updatedBadge = await bell.locator('.notification-badge').textContent();
    const updatedCount = parseInt(updatedBadge || '0');
    expect(updatedCount).toBe(initialCount + 1);

    // Cleanup
    if (newNotif) {
      await supabase.from('notifications').delete().eq('id', newNotif.id);
    }
  });

  test('should handle multiple simultaneous updates', async ({ page }) => {
    await page.goto('http://localhost:3000/production/orders');
    await page.waitForSelector('[data-testid="orders-table"]');

    // Create multiple orders simultaneously
    const promises = Array.from({ length: 5 }, (_, i) =>
      supabase.from('production_orders').insert({
        order_number: `MULTI-TEST-${Date.now()}-${i}`,
        item_name: `Test Item ${i}`,
        quantity: 10,
        unit_price: 100,
        total_cost: 1000,
        status: 'pending',
      })
    );

    await Promise.all(promises);

    // Wait for all realtime updates
    await page.waitForTimeout(3000);

    // Verify all orders appear
    const rows = await page.locator('tr[data-row]').all();
    const hasAllTestOrders = await Promise.all(
      rows.map(async row => {
        const text = await row.textContent();
        return text?.includes('MULTI-TEST-');
      })
    );

    expect(hasAllTestOrders.filter(Boolean).length).toBeGreaterThanOrEqual(5);

    // Cleanup
    await supabase
      .from('production_orders')
      .delete()
      .like('order_number', 'MULTI-TEST-%');
  });

  test('should maintain connection across page navigation', async ({ page }) => {
    // Navigate between pages
    await page.goto('http://localhost:3000/production/orders');
    await page.waitForLoadState('networkidle');

    await page.goto('http://localhost:3000/shipping/shipments');
    await page.waitForLoadState('networkidle');

    await page.goto('http://localhost:3000/financials/invoices');
    await page.waitForLoadState('networkidle');

    // Check websocket in network log
    const client = await page.context().newCDPSession(page);
    await client.send('Network.enable');

    // Verify only ONE websocket connection
    const webSockets = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter(r => r.name.includes('websocket'))
        .length;
    });

    expect(webSockets).toBeLessThanOrEqual(1);
  });
});
```

---

### Supabase Admin Helper

**File:** `/tests/helpers/supabase-admin.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

// Use service role key for admin operations in tests
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Admin key for tests
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
```

---

### Add to Test Suite

**Update:** `/tests/package.json` or main `package.json`

```json
{
  "scripts": {
    "test:realtime": "playwright test tests/21-realtime-functionality.spec.ts --workers=1",
    "test:realtime:ui": "playwright test tests/21-realtime-functionality.spec.ts --ui"
  }
}
```

---

## 3. INTEGRATION WITH EXISTING TESTS

### Update Existing Tests to Account for Realtime

**Problem:** Existing tests may fail if realtime updates interfere

**Solution:** Disable realtime in test environment

**Method 1: Environment Variable**

```typescript
// /src/hooks/useRealtimeSubscription.ts
const isTestEnvironment = process.env.NODE_ENV === 'test';

export function useRealtimeSubscription<TData>({
  enabled = true,
  ...options
}: UseRealtimeSubscriptionOptions<TData>) {
  // Disable realtime in test environment
  const realtimeEnabled = enabled && !isTestEnvironment;

  useEffect(() => {
    if (!realtimeEnabled) return;
    // ... rest of subscription logic
  }, [realtimeEnabled]);
}
```

**Method 2: Test Configuration**

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    extraHTTPHeaders: {
      'X-Test-Mode': 'true', // Set header in tests
    },
  },
});

// Then in hooks:
const isTestMode = typeof window !== 'undefined' &&
                   window.navigator.userAgent.includes('Playwright');
```

---

## 4. REGRESSION TESTING CHECKLIST

### Before Deploying Realtime Changes

- [ ] All existing Playwright tests still pass
- [ ] Manual test: Production orders update in realtime
- [ ] Manual test: Shipments update in realtime
- [ ] Manual test: Invoices update in realtime
- [ ] Manual test: QC inspections update in realtime
- [ ] Manual test: Notifications appear in realtime
- [ ] Manual test: Multi-user scenario works
- [ ] Manual test: Network reconnection works
- [ ] Manual test: No memory leaks after 30 min
- [ ] Manual test: Cleanup on navigation
- [ ] Automated test: Realtime test suite passes
- [ ] Performance: Update latency < 1000ms
- [ ] Performance: No console errors in browser
- [ ] Security: RLS policies enforced

---

## 5. CONTINUOUS TESTING IN CI/CD

### GitHub Actions Workflow

**File:** `.github/workflows/realtime-tests.yml`

```yaml
name: Realtime Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-realtime:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Start dev server
        run: npm run dev &
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}

      - name: Wait for server
        run: npx wait-on http://localhost:3000

      - name: Run realtime tests
        run: npm run test:realtime

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 6. TROUBLESHOOTING TEST FAILURES

### Common Test Issues

**Issue 1: Tests timing out**
```typescript
// Increase timeout for realtime tests
test.setTimeout(30000); // 30 seconds instead of default 30s

test('realtime update', async ({ page }) => {
  // Your test code
});
```

**Issue 2: Race conditions**
```typescript
// Use waitFor instead of waitForTimeout
await page.waitForFunction(() => {
  const rows = document.querySelectorAll('tr[data-row]');
  return rows.length > 5; // Wait for specific condition
}, { timeout: 5000 });
```

**Issue 3: Flaky tests**
```typescript
// Retry flaky realtime tests
test.describe.configure({ retries: 2 });

test('realtime update', async ({ page }) => {
  // Test code
});
```

---

## 7. TEST DATA CLEANUP

### Ensure Tests Don't Pollute Database

```typescript
test.afterEach(async () => {
  // Clean up test data after each test
  await supabase
    .from('production_orders')
    .delete()
    .like('order_number', 'TEST-%');

  await supabase
    .from('notifications')
    .delete()
    .eq('title', 'Test Notification');
});
```

---

## SUCCESS CRITERIA

**Realtime Tests Pass When:**
- ✅ All manual tests complete successfully
- ✅ Automated Playwright tests pass consistently
- ✅ No flaky test failures
- ✅ Tests run in < 5 minutes total
- ✅ No test data left in database
- ✅ Tests work in CI/CD pipeline

---

**Last Updated:** 2025-10-08
**Test Coverage:** Production orders, shipments, invoices, QC, notifications
