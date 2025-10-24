# RLS Security Fixes Migration Guide

## Overview

This migration fixes all Supabase Security Advisor warnings by:
1. Enabling Row Level Security (RLS) on all public tables
2. Fixing function `search_path` security vulnerabilities
3. Ensuring databases are in 100% sync

## Files

- `20251024_enable_rls_security_fixes.sql` - Main migration SQL (enables RLS and fixes functions)
- `20251024_flipbook_rls_policies.sql` - Flipbook RLS policies (MUST apply after the first migration)

## Application Order

**IMPORTANT**: These migrations MUST be applied in order:

1. First: `20251024_enable_rls_security_fixes.sql` - Enables RLS on all tables
2. Second: `20251024_flipbook_rls_policies.sql` - Adds RLS policies for flipbook tables

Failing to apply in order will result in flipbook features being broken (pages won't save).

## How to Apply

### Option 1: Via Supabase Dashboard (Recommended)

#### For Development Database:
1. Go to Supabase Dashboard → Your Development Project
2. Navigate to **SQL Editor**
3. **FIRST MIGRATION** - RLS Security Fixes:
   - Click **New Query**
   - Copy the contents of `20251024_enable_rls_security_fixes.sql`
   - Paste into the editor
   - Click **Run** to execute
   - Verify no errors in the output panel
4. **SECOND MIGRATION** - Flipbook Policies:
   - Click **New Query** (new tab)
   - Copy the contents of `20251024_flipbook_rls_policies.sql`
   - Paste into the editor
   - Click **Run** to execute
   - Verify no errors in the output panel

#### For Production Database:
1. Go to Supabase Dashboard → Your Production Project
2. Navigate to **SQL Editor**
3. **FIRST MIGRATION** - RLS Security Fixes:
   - Click **New Query**
   - Copy the contents of `20251024_enable_rls_security_fixes.sql`
   - Paste into the editor
   - Click **Run** to execute
   - Verify no errors in the output panel
4. **SECOND MIGRATION** - Flipbook Policies:
   - Click **New Query** (new tab)
   - Copy the contents of `20251024_flipbook_rls_policies.sql`
   - Paste into the editor
   - Click **Run** to execute
   - Verify no errors in the output panel

### Option 2: Via psql Command Line

#### For Development Database:
```bash
# Get DIRECT_URL from .env file
# Replace YOUR_DIRECT_URL with the actual connection string from .env
# Apply BOTH migrations in order:
psql "YOUR_DIRECT_URL" \
  -f supabase/migrations/20251024_enable_rls_security_fixes.sql

psql "YOUR_DIRECT_URL" \
  -f supabase/migrations/20251024_flipbook_rls_policies.sql
```

#### For Production Database:
```bash
# Get DIRECT_URL from .env.vercel.production file
# Replace YOUR_PRODUCTION_DIRECT_URL with the actual connection string
# Apply BOTH migrations in order:
psql "YOUR_PRODUCTION_DIRECT_URL" \
  -f supabase/migrations/20251024_enable_rls_security_fixes.sql

psql "YOUR_PRODUCTION_DIRECT_URL" \
  -f supabase/migrations/20251024_flipbook_rls_policies.sql
```

## What This Migration Does

### Tables with RLS Enabled:

#### Part 1: Tables with Existing Policies
- `admin_audit_log`
- `security_audit_log`
- `sso_login_audit`
- `user_profiles`

#### Part 2: Flipbook Tables
- `flipbooks`
- `flipbook_pages`
- `flipbook_versions`
- `flipbook_share_links`
- `share_link_views`
- `hotspots`

#### Part 3: Other Public Tables
- `ai_generation_queue`
- `analytics_events`
- `templates`
- `partner_portal_roles`
- `_prisma_migrations` (with service role policy)

### Functions Fixed:
- `update_updated_at_column` - Added `SET search_path = public, pg_temp`
- `calculate_next_rotation_date` - Added `SET search_path = public, pg_temp`
- `get_effective_permissions` - Added `SET search_path = public, pg_temp`
- `update_next_rotation_date` - Added `SET search_path = public, pg_temp`

## Post-Migration Steps

### 1. Verify RLS is Enabled

Run this query in Supabase SQL Editor:

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;
```

All tables should show `rowsecurity = true`.

### 2. Verify Function Search Paths

```sql
SELECT
    n.nspname as schema,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    p.prosecdef as security_definer,
    p.proconfig as config_settings
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
    'update_updated_at_column',
    'calculate_next_rotation_date',
    'get_effective_permissions',
    'update_next_rotation_date'
);
```

All functions should have `config_settings` showing `{search_path=public,pg_temp}`.

### 3. Enable Leaked Password Protection

This cannot be done via SQL - must be done in Supabase Dashboard:

1. Go to **Settings → Auth → Password Security**
2. Enable **"Leaked password protection"**
3. This checks passwords against HaveIBeenPwned.org

### 4. Test Application

After applying the migration:

1. Test that your application still works correctly
2. Service role operations should work unchanged (service role bypasses RLS)
3. Client-side operations will now be subject to RLS policies

## Important Notes

### RLS Behavior

- **Tables with existing policies**: Will continue to use their existing RLS policies
- **Tables without policies**: Will **DENY ALL ACCESS by default** after RLS is enabled
- **Service role**: Bypasses RLS entirely (your server-side tRPC code will work unchanged)
- **Anonymous users**: Subject to RLS policies

### If Application Breaks

If enabling RLS breaks functionality, you may need to add RLS policies for affected tables.

Example policy to allow authenticated users to read:

```sql
CREATE POLICY "authenticated_users_can_read"
ON public.your_table_name
FOR SELECT
TO authenticated
USING (true);
```

### Flipbook RLS Policies

The second migration (`20251024_flipbook_rls_policies.sql`) adds comprehensive RLS policies for all flipbook tables:

- `flipbooks` - Users can CRUD their own flipbooks; anyone can read published ones
- `flipbook_pages` - Inherit access from parent flipbook
- `hotspots` - Inherit access from parent page/flipbook
- `flipbook_versions` - Users can CRUD versions of their own flipbooks
- `flipbook_share_links` - Users can manage their own share links; public can read active ones
- `share_link_views` - Users can read their own analytics; public can create views

### Other Tables That May Need Policies

- `templates` - May need read access for authenticated users
- `analytics_events` - May need insert access for event tracking

Check all existing policies:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## Rollback

If you need to rollback these migrations, run in REVERSE order:

### Step 1: Remove Flipbook Policies

```sql
-- Remove all flipbook policies
DROP POLICY IF EXISTS "users_read_own_flipbooks" ON public.flipbooks;
DROP POLICY IF EXISTS "anyone_read_published_flipbooks" ON public.flipbooks;
DROP POLICY IF EXISTS "users_create_flipbooks" ON public.flipbooks;
DROP POLICY IF EXISTS "users_update_own_flipbooks" ON public.flipbooks;
DROP POLICY IF EXISTS "users_delete_own_flipbooks" ON public.flipbooks;

DROP POLICY IF EXISTS "users_read_own_flipbook_pages" ON public.flipbook_pages;
DROP POLICY IF EXISTS "anyone_read_published_flipbook_pages" ON public.flipbook_pages;
DROP POLICY IF EXISTS "users_create_own_flipbook_pages" ON public.flipbook_pages;
DROP POLICY IF EXISTS "users_update_own_flipbook_pages" ON public.flipbook_pages;
DROP POLICY IF EXISTS "users_delete_own_flipbook_pages" ON public.flipbook_pages;

DROP POLICY IF EXISTS "users_read_own_hotspots" ON public.hotspots;
DROP POLICY IF EXISTS "anyone_read_published_hotspots" ON public.hotspots;
DROP POLICY IF EXISTS "users_create_own_hotspots" ON public.hotspots;
DROP POLICY IF EXISTS "users_update_own_hotspots" ON public.hotspots;
DROP POLICY IF EXISTS "users_delete_own_hotspots" ON public.hotspots;

DROP POLICY IF EXISTS "users_read_own_flipbook_versions" ON public.flipbook_versions;
DROP POLICY IF EXISTS "users_create_own_flipbook_versions" ON public.flipbook_versions;
DROP POLICY IF EXISTS "users_update_own_flipbook_versions" ON public.flipbook_versions;
DROP POLICY IF EXISTS "users_delete_own_flipbook_versions" ON public.flipbook_versions;

DROP POLICY IF EXISTS "users_read_own_share_links" ON public.flipbook_share_links;
DROP POLICY IF EXISTS "anyone_read_active_share_links_by_token" ON public.flipbook_share_links;
DROP POLICY IF EXISTS "users_create_own_share_links" ON public.flipbook_share_links;
DROP POLICY IF EXISTS "users_update_own_share_links" ON public.flipbook_share_links;
DROP POLICY IF EXISTS "users_delete_own_share_links" ON public.flipbook_share_links;

DROP POLICY IF EXISTS "users_read_own_share_link_views" ON public.share_link_views;
DROP POLICY IF EXISTS "anyone_create_share_link_views" ON public.share_link_views;
```

### Step 2: Disable RLS

```sql
-- Disable RLS on all tables (use with caution!)
ALTER TABLE public.admin_audit_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sso_login_audit DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.flipbooks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.flipbook_pages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.flipbook_versions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.flipbook_share_links DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_link_views DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotspots DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generation_queue DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_portal_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public._prisma_migrations DISABLE ROW LEVEL SECURITY;

-- Remove prisma migrations policy
DROP POLICY IF EXISTS "service_role_prisma_migrations" ON public._prisma_migrations;
```

**Note**: Function changes cannot be easily rolled back. Keep a backup of the old function definitions if needed.

## Security Improvements

After this migration:

- ✅ 18 RLS errors resolved
- ✅ 4 function search_path warnings resolved
- ⚠️ 1 warning remains (leaked password protection - enable in dashboard)

Total: **22 security issues fixed**

## Support

If you encounter issues:

1. Check the Supabase Dashboard → Database → Logs for error messages
2. Verify RLS policies are correctly configured for your use case
3. Test with service role key (bypasses RLS) to isolate RLS vs other issues
4. Review the [Supabase RLS documentation](https://supabase.com/docs/guides/auth/row-level-security)
