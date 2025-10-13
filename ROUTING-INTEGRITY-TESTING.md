# Routing Integrity Testing Guide

## Overview

This document outlines our comprehensive routing integrity testing system that prevents broken navigation paths, missing pages, and 404 errors in the application.

## Why This Matters

During development, we discovered that action buttons were routing to non-existent pages (e.g., "New" buttons pointing to `/new` routes that didn't exist). This system prevents such issues from reaching production.

---

## Testing Layers

### Layer 1: Static Analysis (Pre-Runtime)

**Script**: `scripts/verify-routing-integrity.ts`
**Run**: `npm run audit:routing-integrity`

**What it checks**:
- ✅ Every `router.push()` call has a corresponding page file
- ✅ Every "new" route has a `/new` directory with `page.tsx`
- ✅ Routes use correct module prefixes (e.g., `/production/orders` not `/orders`)
- ✅ Action Button → Target Page matrix verification

**When to run**:
- Before committing code changes
- After adding new action buttons
- Before deploying to production
- As part of CI/CD pipeline

**Example Output**:
```
🔍 Scanning for routing integrity issues...

✅ No routing integrity issues found!

📊 ACTION BUTTON → TARGET PAGE MATRIX

Module              | Action Button           | Target Route                      | Status
───────────────────────────────────────────────────────────────────────────────────────
Production          | New Order              | /production/orders/new            | ✅ OK
Production          | New Shop Drawing       | /production/shop-drawings/new     | ✅ OK
Production          | New Prototype          | /production/prototypes/new        | ✅ OK
CRM                 | New Contact            | /crm/contacts/new                 | ✅ OK
Design              | New Project            | /design/projects/new              | ✅ OK
Financials          | New Invoice            | /financials/invoices/new          | ✅ OK
Partners            | New Designer           | /partners/designers/new           | ✅ OK
```

---

### Layer 2: Runtime E2E Testing (Playwright)

**Test File**: `tests/60-routing-integrity.spec.ts`
**Run**: `npm run test:routing`

**What it checks**:
- ✅ Clicking "New" buttons navigates to valid create forms (no 404s)
- ✅ Row clicks navigate to valid detail pages
- ✅ Action menu items route correctly
- ✅ Empty state action buttons work
- ✅ All critical routes return 200 (not 404)
- ✅ Navigation actually loads pages (not just checks URLs)

**Test Categories**:

1. **Production Module - New Buttons**
   - Orders, Shop Drawings, Prototypes, Packing, QC, Factory Reviews

2. **CRM Module - New Buttons**
   - Contacts, Leads, Customers

3. **Design Module - New Buttons**
   - Projects, Briefs

4. **Financials Module - New Buttons**
   - Invoices, Payments

5. **Partners Module - New Buttons**
   - Designers, Factories

6. **Row Click Navigation**
   - Verifies clicking table rows navigates to detail pages

7. **404 Detection**
   - Tests all critical routes return 200

8. **Action Menu Items**
   - Verifies context menu options route correctly

9. **Empty State Buttons**
   - Tests action buttons in empty states

---

## Quick Reference: Commands

```bash
# Static Analysis (Fast, Pre-Runtime)
npm run audit:routing-integrity

# E2E Tests (Slower, Full Browser Testing)
npm run test:routing

# Run Both
npm run audit:all
```

---

## Integration with CI/CD

### Pre-Commit Hook

Add to `.git/hooks/pre-commit`:
```bash
#!/bin/bash
npm run audit:routing-integrity
if [ $? -ne 0 ]; then
  echo "❌ Routing integrity check failed. Fix issues before committing."
  exit 1
fi
```

### GitHub Actions

Add to `.github/workflows/ci.yml`:
```yaml
- name: Routing Integrity Check
  run: npm run audit:routing-integrity

- name: Routing E2E Tests
  run: npm run test:routing
```

---

## Common Issues & Solutions

### Issue 1: Missing /new Directory

**Error**:
```
❌ Missing /new directory for route "/production/packing/new"
Expected: src/app/production/packing/new/page.tsx
```

**Solution**:
1. Create the directory: `mkdir -p src/app/production/packing/new`
2. Create `page.tsx` with create form
3. Follow the pattern from `src/app/production/prototypes/new/page.tsx`

---

### Issue 2: Incorrect Module Prefix

**Error**:
```
❌ Route "/shop-drawings/new" may be missing "/production" prefix
```

**Solution**:
Change:
```typescript
router.push("/shop-drawings/new")  // ❌ Wrong
```

To:
```typescript
router.push("/production/shop-drawings/new")  // ✅ Correct
```

---

### Issue 3: Missing Page File

**Error**:
```
❌ Route "/partners/designers/123" does not have a corresponding page file
```

**Solution**:
1. Create dynamic route: `src/app/partners/designers/[id]/page.tsx`
2. Use Next.js 15 async params pattern:
```typescript
interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DesignerDetailPage({ params }: PageProps) {
  const { id } = use(params);
  // ...
}
```

---

## Action Button Checklist

When adding a new "New" button:

- [ ] Create `/new` directory in correct module
- [ ] Create `page.tsx` with form
- [ ] Use correct route prefix in `router.push()`
- [ ] Add cache invalidation with `api.useUtils()`
- [ ] Test button click navigates correctly
- [ ] Run `npm run audit:routing-integrity`
- [ ] Run `npm run test:routing`

---

## Module Route Patterns

### Production Module
```
/production/orders/new
/production/shop-drawings/new
/production/prototypes/new
/production/packing/new
/production/qc/new
/production/factory-reviews/new
```

### CRM Module
```
/crm/contacts/new
/crm/leads/new
/crm/customers/new
```

### Design Module
```
/design/projects/new
/design/briefs/new
```

### Financials Module
```
/financials/invoices/new
/financials/payments/new
```

### Partners Module
```
/partners/designers/new
/partners/factories/new
```

---

## Best Practices

### ✅ DO

- Run `npm run audit:routing-integrity` before committing
- Create `/new` pages before adding "New" buttons
- Use correct module prefixes in all routes
- Follow Next.js 15 async params pattern
- Test navigation manually after adding buttons

### ❌ DON'T

- Add action buttons without verifying target pages exist
- Use relative paths or incorrect prefixes
- Skip testing after adding navigation
- Assume routes work without verification

---

## Testing Strategy

### Development Phase
1. **Before adding button**: Verify target page exists
2. **After adding button**: Run static analysis
3. **Before committing**: Run E2E tests

### CI/CD Pipeline
1. **On PR**: Run static analysis (fast)
2. **Before merge**: Run E2E tests (comprehensive)
3. **Before deploy**: Run full audit

### Production Monitoring
- Set up 404 tracking in analytics
- Monitor for unexpected navigation errors
- Regular audits of user navigation patterns

---

## Extending the System

### Adding New Module

1. **Update Static Analysis**:
   Edit `scripts/verify-routing-integrity.ts`:
   ```typescript
   const validModules = [
     'crm', 'production', 'design', 'financials',
     'partners', 'your-new-module'  // Add here
   ];
   ```

2. **Add E2E Tests**:
   Edit `tests/60-routing-integrity.spec.ts`:
   ```typescript
   test.describe('Your New Module - New Buttons', () => {
     test('Your Entity - New button routes correctly', async ({ page }) => {
       await page.goto('/your-module/entity');
       // ... test implementation
     });
   });
   ```

3. **Update Matrix**:
   Add to action button matrix in static analysis script

---

## Troubleshooting

### Test Failures

**Symptom**: E2E test fails but static analysis passes

**Likely Cause**: Page file exists but isn't exported correctly or has runtime errors

**Solution**:
1. Check page has `export default function`
2. Verify no TypeScript errors
3. Test page loads manually in browser

---

**Symptom**: Static analysis fails but page works in browser

**Likely Cause**: Dynamic route segments or template literals in `router.push()`

**Solution**:
1. Check if route uses `${variable}` syntax
2. Verify dynamic routes use `[id]` folder structure
3. Update static analysis to handle this pattern

---

## Maintenance

### Weekly
- Review 404 reports from production
- Check for new modules without routing tests

### Monthly
- Audit all action buttons manually
- Review and update test coverage
- Check for new routing patterns

### Per Release
- Run full routing integrity suite
- Verify all new features have routing tests
- Update documentation for new patterns

---

## Resources

- **Static Analysis Script**: `scripts/verify-routing-integrity.ts`
- **E2E Test Suite**: `tests/60-routing-integrity.spec.ts`
- **Next.js Routing Docs**: https://nextjs.org/docs/app/building-your-application/routing
- **Playwright Testing**: https://playwright.dev/docs/intro

---

## Quick Start

### For Developers

```bash
# 1. Add a "New" button
<Button onClick={() => router.push("/my-module/entity/new")}>
  New Entity
</Button>

# 2. Create the target page
mkdir -p src/app/my-module/entity/new
touch src/app/my-module/entity/new/page.tsx

# 3. Verify it works
npm run audit:routing-integrity
npm run test:routing
```

### For QA

```bash
# Run complete routing integrity check
npm run audit:all

# Run just routing tests
npm run test:routing
```

### For CI/CD

```bash
# Fast check for PR validation
npm run audit:routing-integrity

# Full check before deployment
npm run audit:all && npm run test:routing
```

---

**Last Updated**: 2025-10-12
**Maintained By**: Development Team
**Related Docs**: CACHE-INVALIDATION-MIGRATION-COMPLETE.md
