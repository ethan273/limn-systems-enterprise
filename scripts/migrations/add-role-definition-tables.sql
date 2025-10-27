-- ============================================
-- RBAC Phase 1 - Database-Driven Role System
-- Migration: Add role_definitions, permission_definitions, role_permissions tables
-- Date: 2025-10-27
-- ============================================

-- Create role_definitions table
CREATE TABLE IF NOT EXISTS public.role_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_key VARCHAR(50) NOT NULL UNIQUE,
    role_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    hierarchy_level INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

-- Create indexes for role_definitions
CREATE INDEX IF NOT EXISTS idx_role_definitions_key ON public.role_definitions(role_key);
CREATE INDEX IF NOT EXISTS idx_role_definitions_active ON public.role_definitions(is_active);
CREATE INDEX IF NOT EXISTS idx_role_definitions_hierarchy ON public.role_definitions(hierarchy_level);

-- Add comments for role_definitions
COMMENT ON TABLE public.role_definitions IS 'Stores metadata for all system roles';
COMMENT ON COLUMN public.role_definitions.role_key IS 'Unique key for the role (e.g., super_admin, admin, manager)';
COMMENT ON COLUMN public.role_definitions.hierarchy_level IS 'Higher numbers = higher privileges (super_admin = 100, viewer = 10)';

-- ============================================

-- Create permission_definitions table
CREATE TABLE IF NOT EXISTS public.permission_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission_key VARCHAR(100) NOT NULL UNIQUE,
    permission_name VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    is_system BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

-- Create indexes for permission_definitions
CREATE INDEX IF NOT EXISTS idx_permission_definitions_key ON public.permission_definitions(permission_key);
CREATE INDEX IF NOT EXISTS idx_permission_definitions_category ON public.permission_definitions(category);
CREATE INDEX IF NOT EXISTS idx_permission_definitions_active ON public.permission_definitions(is_active);

-- Add comments for permission_definitions
COMMENT ON TABLE public.permission_definitions IS 'Stores metadata for all system permissions';
COMMENT ON COLUMN public.permission_definitions.permission_key IS 'Unique key for the permission (e.g., admin.access, users.view)';
COMMENT ON COLUMN public.permission_definitions.category IS 'Permission category (admin, production, orders, finance, etc.)';

-- ============================================

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.role_definitions(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permission_definitions(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_role_permission UNIQUE (role_id, permission_id)
);

-- Create indexes for role_permissions
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON public.role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_active ON public.role_permissions(is_active);

-- Add comments for role_permissions
COMMENT ON TABLE public.role_permissions IS 'Junction table mapping roles to their permissions';
COMMENT ON COLUMN public.role_permissions.is_active IS 'Allows temporarily disabling specific role-permission mappings';

-- ============================================
-- Verification Queries
-- ============================================

-- Verify tables were created
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('role_definitions', 'permission_definitions', 'role_permissions')
ORDER BY table_name;

-- Verify indexes were created
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('role_definitions', 'permission_definitions', 'role_permissions')
ORDER BY tablename, indexname;

-- ============================================
-- Success Message
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Role definition tables created successfully!';
    RAISE NOTICE '   - role_definitions: Stores role metadata';
    RAISE NOTICE '   - permission_definitions: Stores permission metadata';
    RAISE NOTICE '   - role_permissions: Maps roles to permissions';
    RAISE NOTICE '';
    RAISE NOTICE 'Next step: Run the seeding script to populate initial data';
END $$;
