# 🚀 RLS Implementation - Quick Start Guide

**Time Required:** 5-10 minutes
**Status:** Ready to execute

---

## ✅ Step-by-Step Instructions

### Step 1: Open Supabase SQL Editor (1 minute)

1. Go to: https://supabase.com/dashboard/project/gwqkbjymbarkufwvdmar
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"** button

### Step 2: Copy & Paste SQL Script (1 minute)

1. Open file: `/Users/eko3/limn-systems-enterprise/scripts/EXECUTE-RLS-NOW.sql`
2. Press **Cmd+A** (select all)
3. Press **Cmd+C** (copy)
4. Go back to Supabase SQL Editor
5. Press **Cmd+V** (paste entire script)

### Step 3: Execute Script (30 seconds)

1. Click **"Run"** button (or press **Cmd+Enter**)
2. Wait for execution (should take 5-10 seconds)
3. Look for **"Success"** message at bottom

**Expected Success Message:**
```
Success. Rows affected: 48
```

This means:
- 12 tables had RLS enabled
- 36 policies were created

### Step 4: Verify RLS Enabled (1 minute)

Copy and paste this verification query:

```sql
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'customers', 'orders', 'invoices', 'shipments',
  'production_orders', 'projects', 'order_items',
  'invoice_line_items', 'payment_allocations',
  'customer_portal_access', 'portal_configurations',
  'portal_module_settings'
)
ORDER BY tablename;
```

**Expected Result:**
All 12 tables should show `rowsecurity = true` ✅

### Step 5: Run Security Tests (2 minutes)

Open terminal and run:

```bash
cd /Users/eko3/limn-systems-enterprise
npx playwright test tests/30-security-data-isolation.spec.ts --workers=1
```

**Before RLS:** 2/28 passing (7%)
**After RLS:** 20+/28 passing (70%+) expected

---

## 🎯 What This Accomplishes

### Security Improvements

**Before RLS:**
- ❌ Any customer can query ANY customer's data
- ❌ No database-level security
- ❌ Relies only on application code

**After RLS:**
- ✅ Customers can ONLY see their own data
- ✅ Database enforces security automatically
- ✅ Defense in depth (app + database security)

### Example Protection

**Before:**
```typescript
// Customer A maliciously queries Customer B's orders
const { data } = await supabase
  .from('orders')
  .select('*')
  .eq('customer_id', 'customer-b-uuid');

// Returns data ❌ SECURITY BREACH!
```

**After:**
```typescript
// Same query
const { data } = await supabase
  .from('orders')
  .select('*')
  .eq('customer_id', 'customer-b-uuid');

// Returns empty [] ✅ RLS BLOCKED IT!
```

---

## ⚠️ Troubleshooting

### Issue: "Policy already exists"

**Cause:** Script was run before

**Solution:**
```sql
-- Drop all policies first, then re-run main script
DROP POLICY IF EXISTS "customers_view_own_record" ON customers;
DROP POLICY IF EXISTS "employees_view_all_customers" ON customers;
-- ... (script will handle errors gracefully)
```

### Issue: "Table not found"

**Cause:** Table name doesn't match schema

**Solution:** Check table exists:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

### Issue: Tests still failing

**Cause:** Missing test data setup (customer_portal_access records)

**Solution:** The test helper creates this automatically, but you can verify:
```sql
SELECT * FROM customer_portal_access LIMIT 5;
```

---

## 📊 Expected Test Results

### RLS Policies Tests (6 tests)
- ✅ Customer A cannot access Customer B orders
- ✅ Customer A cannot access Customer B invoices
- ✅ Customer A cannot access Customer B shipments
- ✅ Designer can only see assigned projects
- ✅ Factory can only see assigned production orders
- ✅ Admin can see all data

### Remaining Tests (may still fail - require code changes)
- ⚠️ Middleware access control (needs portal access records)
- ⚠️ API permission enforcement (needs tRPC updates)
- ✅ SQL injection prevention (Prisma handles this)
- ⚠️ Session security (needs session tests)

---

## 🔄 Rollback Plan

If something breaks, disable RLS immediately:

```sql
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE shipments DISABLE ROW LEVEL SECURITY;
ALTER TABLE production_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_allocations DISABLE ROW LEVEL SECURITY;
ALTER TABLE customer_portal_access DISABLE ROW LEVEL SECURITY;
ALTER TABLE portal_configurations DISABLE ROW LEVEL SECURITY;
ALTER TABLE portal_module_settings DISABLE ROW LEVEL SECURITY;
```

This will restore previous behavior while keeping policies for later re-enable.

---

## ✅ Success Checklist

- [ ] Supabase SQL Editor opened
- [ ] Script copied and pasted
- [ ] Script executed successfully
- [ ] Verification query shows RLS enabled
- [ ] Security tests run (20+/28 passing expected)
- [ ] No errors in application logs

---

## 📞 Next Steps After RLS

1. **Review failing tests** - Document which tests still fail
2. **Fix remaining issues** - Update code for failing tests
3. **Run full test suite** - Both 29 and 30
4. **Deploy to production** - When 50/50 tests pass

---

**Total Time:** 5-10 minutes
**Risk Level:** LOW (easy rollback available)
**Impact:** HIGH (major security improvement)

---

**Ready? Start with Step 1!** 🚀
