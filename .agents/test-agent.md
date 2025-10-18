# Test Agent Template

**Purpose:** Write, run, and maintain tests for the application

---

## Initial Setup

```
I'm working on Limn Systems Enterprise and need help with testing.

Please read:
1. /Users/eko3/limn-systems-enterprise/.agents/PROJECT-CONTEXT.md
2. /Users/eko3/limn-systems-enterprise/.agents/test-agent.md

I need to: [TEST OBJECTIVE]
```

---

## What This Agent Does

✅ Writes Playwright E2E tests  
✅ Creates unit tests for utilities/hooks  
✅ Generates test data and fixtures  
✅ Runs test suites and analyzes results  
✅ Debugs failing tests  
✅ Improves test coverage  
✅ Creates accessibility tests  
✅ Performance testing  

---

## Testing Framework Overview

**E2E Tests:** Playwright (`tests/*.spec.ts`)  
**Unit Tests:** Vitest (`src/**/*.test.ts`)  
**Test Database:** Separate test environment  

### Available Test Commands

```bash
# E2E Tests
npm run test:e2e           # Run all Playwright tests
npm run test:e2e:ui        # Open Playwright UI
npm run test:e2e:debug     # Debug mode

# Specific test files
npm run test:e2e -- tests/30-crm-contacts-comprehensive.spec.ts

# Unit Tests
npm run test               # Run Vitest tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage

# Comprehensive suites
npm run test:comprehensive:crm       # CRM module tests
npm run test:comprehensive:production  # Production tests
npm run test:portals              # All portal tests
```

---

## Writing E2E Tests

### Test File Structure

```typescript
// tests/[feature].spec.ts
import { test, expect } from '@playwright/test';

test.describe('[Feature Name]', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Navigate to feature
    await page.goto('/module/feature');
  });

  test('should display list of items', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('[data-testid="item-list"]');
    
    // Assertions
    const items = page.locator('[data-testid="item-row"]');
    await expect(items).toHaveCount(expect.any(Number));
  });

  test('should create new item', async ({ page }) => {
    // Click create button
    await page.click('[data-testid="create-button"]');
    
    // Fill form
    await page.fill('[name="name"]', 'Test Item');
    await page.fill('[name="description"]', 'Test Description');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify success
    await expect(page.locator('text=Item created')).toBeVisible();
  });
});
```

### Test Patterns

**Navigation:**
```typescript
await page.goto('/path');
await page.click('text=Menu Item');
await page.waitForURL('/expected/path');
```

**Form Interaction:**
```typescript
await page.fill('[name="field"]', 'value');
await page.selectOption('[name="dropdown"]', 'option');
await page.check('[name="checkbox"]');
```

**Assertions:**
```typescript
await expect(page.locator('[data-testid="title"]')).toHaveText('Expected Text');
await expect(page.locator('.item')).toHaveCount(5);
await expect(page).toHaveURL('/expected/path');
await expect(element).toBeVisible();
await expect(element).toBeEnabled();
```

---

## Test Checklist

### Before Writing Tests
- [ ] Understand the feature completely
- [ ] Know the happy path
- [ ] Identify edge cases
- [ ] Check existing similar tests

### Test Coverage Should Include
- [ ] Happy path (normal usage)
- [ ] Validation errors (bad input)
- [ ] Authentication/authorization
- [ ] Loading states
- [ ] Empty states
- [ ] Error states
- [ ] Edge cases

### After Writing Tests
- [ ] Tests pass locally
- [ ] Tests are deterministic (no flakes)
- [ ] Good test data cleanup
- [ ] Clear, descriptive test names
- [ ] Appropriate assertions
- [ ] No hardcoded waits (use waitFor)

---

## Debugging Failing Tests

```bash
# Run in headed mode
npm run test:e2e:debug -- tests/[file].spec.ts

# Run specific test
npm run test:e2e -- tests/[file].spec.ts -g "test name"

# Generate trace
npm run test:e2e -- --trace on
```

**Common issues:**
- Timing issues → Use `waitForSelector` not `wait(ms)`
- Flaky tests → Check for race conditions
- Selector issues → Use data-testid attributes

---

## Example: Complete CRUD Test Suite

See existing tests for patterns:
- `tests/30-crm-contacts-comprehensive.spec.ts`
- `tests/33-production-orders-comprehensive.spec.ts`
- `tests/50-products-comprehensive.spec.ts`

These show full CRUD + edge cases + error handling.
