# Production Database Setup Guide

**Last Updated**: October 18, 2025
**Status**: ✅ CRITICAL - Required for Production Deployment

---

## 🚨 Overview

This guide documents the **critical database permissions fix** discovered on October 18, 2025, that resolved the "permission denied for schema public" errors in production.

**The Problem**: Even with correct environment variables and service_role key, Supabase production database was denying all queries with error code 42501.

**The Solution**: Schema-level permissions must be granted to service_role in addition to table-level RLS policies.

---

## ✅ Complete Production Database Setup

### Step 1: Verify Environment Variables

First, ensure your Vercel environment variables are correct:

```
NEXT_PUBLIC_SUPABASE_URL=https://hwaxogapihsqleyzpqtj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc... (with "role":"anon")
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (with "role":"service_role")
```

**Verify the service_role key** by decoding the JWT:
```bash
echo "YOUR_SERVICE_KEY" | cut -d'.' -f2 | base64 -d | jq
```

Expected output should show `"role": "service_role"` (NOT "anon").

### Step 2: Create RLS Bypass Policies (Table-Level)

Go to Supabase Dashboard → Your Production Project → SQL Editor

Run this script to create service_role bypass policies on ALL tables:

```sql
-- Script to add service_role bypass policies to ALL tables with RLS enabled
DO $$
DECLARE
  tbl TEXT;
BEGIN
  -- Loop through all tables in public schema that have RLS enabled
  FOR tbl IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    AND rowsecurity = true
  LOOP
    -- Drop existing service_role policy if it exists
    EXECUTE format('DROP POLICY IF EXISTS "service_role_all_access" ON %I', tbl);

    -- Create new service_role bypass policy
    EXECUTE format('
      CREATE POLICY "service_role_all_access" ON %I
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true)
    ', tbl);

    RAISE NOTICE 'Added service_role bypass policy to table: %', tbl;
  END LOOP;
END $$;

-- Verify policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  roles
FROM pg_policies
WHERE schemaname = 'public'
AND policyname = 'service_role_all_access'
ORDER BY tablename;
```

You should see ~250+ tables with the `service_role_all_access` policy.

### Step 3: Grant Schema-Level Permissions (CRITICAL!)

**This is the step that was missing and causing all the permission errors!**

Run this SQL in Supabase SQL Editor:

```sql
-- Grant all permissions to service_role on public schema
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Make it permanent for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS IN SCHEMA public TO service_role;
```

### Step 4: Verify the Fix

Run this to verify grants were applied:

```sql
-- Check schema-level grants
SELECT
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND grantee = 'service_role'
LIMIT 10;
```

You should see multiple rows showing service_role with privileges: SELECT, INSERT, UPDATE, DELETE, etc.

### Step 5: Test Production Deployment

1. **No redeploy needed** - this is a database-side fix
2. Visit your production site: https://limn-systems-enterprise.vercel.app
3. Log in with Google OAuth
4. Dashboard should load with data (no "permission denied" errors)
5. Check Vercel Runtime Logs - should see successful database queries

---

## 🔍 Diagnostic Queries

### Check if Tables Exist

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Expected: ~250+ tables (orders, customers, invoices, tasks, etc.)

### Check RLS Status

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('orders', 'user_profiles', 'tasks', 'projects', 'customers')
ORDER BY tablename;
```

Expected: `rowsecurity = true` for all tables

### Check Service Role Policies

```sql
SELECT
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND policyname = 'service_role_all_access'
ORDER BY tablename;
```

Expected: ~250+ tables with the service_role_all_access policy

### Check Schema Permissions

```sql
-- Check if service_role has USAGE on public schema
SELECT
  nspname as schema_name,
  nspowner::regrole as owner
FROM pg_namespace
WHERE nspname = 'public';

-- Check table-level grants
SELECT
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND grantee = 'service_role'
LIMIT 20;
```

---

## 🐛 Common Issues & Solutions

### Issue: "permission denied for schema public" (Error Code: 42501)

**Symptoms**:
```
[DB ERROR] Failed to fetch from customers: {
  code: '42501',
  details: null,
  hint: null,
  message: 'permission denied for schema public'
}
```

**Cause**: Schema-level permissions not granted to service_role

**Solution**: Run Step 3 above (GRANT statements)

### Issue: Service role key appears correct but still getting errors

**Diagnostic**:
1. Decode your service_role key JWT
2. Verify it shows `"role": "service_role"`
3. Verify the `"ref"` matches your production project (hwaxogapihsqleyzpqtj)

**Solution**: If JWT is correct, issue is schema permissions (run Step 3)

### Issue: Tables don't exist

**Cause**: Using wrong Supabase project (dev vs prod)

**Solution**:
1. Verify NEXT_PUBLIC_SUPABASE_URL points to correct project
2. Check table count: should be ~250+ tables in production

### Issue: RLS policies exist but queries still fail

**Cause**: Schema-level permissions missing (Step 3 not run)

**Solution**: Run the GRANT statements in Step 3

---

## 📋 Production Readiness Checklist

Before marking database as production-ready:

- [ ] Environment variables configured in Vercel (Production, Preview, Development)
- [ ] Service role key verified (decoded JWT shows "role": "service_role")
- [ ] Tables exist in production database (~250+ tables)
- [ ] RLS policies created on all tables (`service_role_all_access`)
- [ ] Schema-level permissions granted (GRANT USAGE, GRANT ALL)
- [ ] Verified with diagnostic queries (schema permissions exist)
- [ ] Tested production deployment (dashboard loads with data)
- [ ] Checked Vercel runtime logs (no "permission denied" errors)
- [ ] Google OAuth authentication works
- [ ] Data fetching works (tasks, orders, customers, etc.)

---

## 🎯 Why This Fix Was Needed

Supabase's Row Level Security (RLS) implementation requires **two layers** of permissions:

1. **Table-level RLS policies** - Control which rows users can access
2. **Schema-level permissions** - Control whether role can access schema at all

Even if table-level policies exist and allow access, without schema-level permissions, the service_role cannot execute queries.

**The Error Sequence**:
1. Application tries to query `orders` table
2. Supabase checks: "Does service_role have USAGE on schema public?"
3. Answer: NO → Returns error 42501 "permission denied for schema public"
4. Never even gets to check table-level RLS policies!

**After the Fix**:
1. Application tries to query `orders` table
2. Supabase checks: "Does service_role have USAGE on schema public?"
3. Answer: YES → Proceeds to check table-level policies
4. Checks `service_role_all_access` policy: USING (true) → Access granted
5. Query succeeds!

---

## 📚 Related Documentation

- [SUPABASE_ENV_VERIFICATION.md](./SUPABASE_ENV_VERIFICATION.md) - Environment variable setup
- [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) - Deployment guide
- [VERCEL_ENV_CHECKLIST.md](./VERCEL_ENV_CHECKLIST.md) - Pre-deployment checklist

---

## 🔐 Security Notes

- ✅ service_role key is **server-side only** - never exposed to client
- ✅ RLS policies protect data from client-side access (using anon key)
- ✅ Schema-level permissions only apply to server-side service_role
- ✅ Granting permissions to service_role is safe and necessary
- ⚠️ Never commit service_role key to git
- ⚠️ Never use service_role key in client-side code

---

**Status**: ✅ **RESOLVED** (October 18, 2025)

The production database is now fully configured and working. All permission errors have been resolved.

---

## 🍪 Cookie Persistence Fix (October 18, 2025)

**Issue**: Double authentication required in incognito/private browsing mode

**Root Cause**: Cookies with `sameSite: 'lax'` were being dropped during OAuth redirect chains in incognito mode.

**Solution**: Changed cookie configuration to use `sameSite: 'none'` in production.

**Code Changes** (`/src/app/auth/callback/route.ts`):
```javascript
// Lines 229 and 331
sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as const,
secure: process.env.NODE_ENV === 'production',
```

**Why This is Needed**:
- Modern browsers enforce strict cookie policies in incognito mode
- OAuth flows involve multiple redirects (Google → callback → establish-session → dashboard)
- `sameSite: 'lax'` cookies can be dropped during cross-site redirects
- `sameSite: 'none'` with `secure: true` allows cookies to persist

**Deployment**: Redeploy to production to apply this fix.

**Verification**: After redeployment, test OAuth login in incognito mode - should only require one authentication.
