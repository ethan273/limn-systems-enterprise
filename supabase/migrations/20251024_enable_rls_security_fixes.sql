-- ============================================================================
-- RLS Security Fixes Migration
-- ============================================================================
-- This migration addresses all Supabase Security Advisor warnings:
-- 1. Enables RLS on tables that have policies but RLS disabled
-- 2. Enables RLS on all public tables exposed to PostgREST
-- 3. Fixes function search_path security issues
-- ============================================================================

-- ============================================================================
-- PART 1: Enable RLS on tables with existing policies
-- ============================================================================
-- These tables already have RLS policies defined but RLS is not enabled

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sso_login_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 2: Enable RLS on flipbook-related tables
-- ============================================================================
-- Flipbook tables need RLS enabled to prevent unauthorized access

ALTER TABLE public.flipbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flipbook_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flipbook_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flipbook_share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_link_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotspots ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 3: Enable RLS on other public tables
-- ============================================================================

ALTER TABLE public.ai_generation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_portal_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 4: Enable RLS on Prisma migrations table
-- ============================================================================
-- Note: This table is used by Prisma for tracking migrations
-- We enable RLS but add a permissive policy for service role

ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;

-- Add policy to allow service role full access to migrations table
CREATE POLICY "service_role_prisma_migrations"
ON public._prisma_migrations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- PART 5: Fix function search_path security warnings
-- ============================================================================
-- Set explicit search_path on functions to prevent security vulnerabilities

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Fix calculate_next_rotation_date function
CREATE OR REPLACE FUNCTION public.calculate_next_rotation_date(
    p_current_date TIMESTAMP WITH TIME ZONE,
    p_rotation_period TEXT
)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN CASE p_rotation_period
        WHEN 'weekly' THEN p_current_date + INTERVAL '7 days'
        WHEN 'biweekly' THEN p_current_date + INTERVAL '14 days'
        WHEN 'monthly' THEN p_current_date + INTERVAL '1 month'
        WHEN 'quarterly' THEN p_current_date + INTERVAL '3 months'
        ELSE p_current_date + INTERVAL '30 days'
    END;
END;
$$;

-- Fix get_effective_permissions function
CREATE OR REPLACE FUNCTION public.get_effective_permissions(
    p_user_id UUID,
    p_partner_id UUID
)
RETURNS TABLE(permission TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT rp.permission
    FROM partner_portal_access ppa
    JOIN partner_portal_roles ppr ON ppa.role_id = ppr.id
    JOIN role_permissions rp ON ppr.id = rp.role_id
    WHERE ppa.user_id = p_user_id
      AND ppa.partner_id = p_partner_id
      AND ppa.is_active = true;
END;
$$;

-- Fix update_next_rotation_date function
CREATE OR REPLACE FUNCTION public.update_next_rotation_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.rotation_period IS NOT NULL AND NEW.rotation_period != OLD.rotation_period THEN
        NEW.next_rotation_date := calculate_next_rotation_date(NOW(), NEW.rotation_period);
    END IF;
    RETURN NEW;
END;
$$;

-- ============================================================================
-- VERIFICATION QUERIES (commented out - run manually to verify)
-- ============================================================================

-- Check that RLS is enabled on all tables:
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename NOT LIKE 'pg_%'
-- ORDER BY tablename;

-- Check function search paths:
-- SELECT
--     n.nspname as schema,
--     p.proname as function_name,
--     pg_get_function_identity_arguments(p.oid) as arguments,
--     p.prosecdef as security_definer,
--     p.proconfig as config_settings
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public'
-- AND p.proname IN (
--     'update_updated_at_column',
--     'calculate_next_rotation_date',
--     'get_effective_permissions',
--     'update_next_rotation_date'
-- );

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. Auth leaked password protection must be enabled in Supabase dashboard:
--    Settings > Auth > Password Security > Enable leaked password protection
--
-- 2. This migration only ENABLES RLS. Existing policies remain unchanged.
--    Tables with existing policies will continue to use those policies.
--
-- 3. Tables without policies will block all access by default (RLS denies all).
--    You may need to add appropriate RLS policies for application access.
--
-- 4. Service role bypasses RLS, so server-side code will continue to work.
--
-- 5. Test thoroughly in staging before applying to production!
-- ============================================================================
