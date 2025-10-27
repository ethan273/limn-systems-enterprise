-- ============================================
-- RBAC Phase 2 - Scoped Permissions
-- Migration: Add permission_scopes table
-- Date: 2025-10-27
-- ============================================

-- Create permission_scopes table
CREATE TABLE IF NOT EXISTS public.permission_scopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User being granted scoped access
    user_id UUID NOT NULL,

    -- Permission being scoped
    permission_key VARCHAR(100) NOT NULL,
    -- References permission_definitions.permission_key

    -- Resource scope
    resource_type VARCHAR(100) NOT NULL,
    -- e.g., 'order', 'production_order', 'project', 'document', 'team', 'customer'

    resource_id UUID,
    -- Specific resource UUID (NULL = applies to all resources of this type)

    -- Optional constraints
    scope_metadata JSONB,
    -- Flexible JSON for additional constraints:
    -- {
    --   "customer_id": "uuid",
    --   "team_id": "uuid",
    --   "project_id": "uuid",
    --   "department": "engineering",
    --   "status": ["draft", "pending"]
    -- }

    -- Access control
    granted_by UUID,
    granted_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

    expires_at TIMESTAMPTZ(6),
    -- NULL = never expires

    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Audit trail
    reason TEXT,
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_expiration CHECK (expires_at IS NULL OR expires_at > granted_at)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_permission_scopes_user ON public.permission_scopes(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_scopes_permission ON public.permission_scopes(permission_key);
CREATE INDEX IF NOT EXISTS idx_permission_scopes_resource ON public.permission_scopes(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_permission_scopes_active ON public.permission_scopes(is_active);
CREATE INDEX IF NOT EXISTS idx_permission_scopes_expires ON public.permission_scopes(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_permission_scopes_metadata ON public.permission_scopes USING GIN (scope_metadata);

-- Add comments for documentation
COMMENT ON TABLE public.permission_scopes IS 'Resource-level permission grants for individual users';
COMMENT ON COLUMN public.permission_scopes.user_id IS 'User being granted scoped access';
COMMENT ON COLUMN public.permission_scopes.permission_key IS 'Permission being scoped (references permission_definitions.permission_key)';
COMMENT ON COLUMN public.permission_scopes.resource_type IS 'Type of resource (order, production_order, project, document, team, customer)';
COMMENT ON COLUMN public.permission_scopes.resource_id IS 'Specific resource UUID (NULL = all resources of this type)';
COMMENT ON COLUMN public.permission_scopes.scope_metadata IS 'Flexible JSON for additional constraints (customer_id, team_id, status, etc.)';
COMMENT ON COLUMN public.permission_scopes.granted_by IS 'User who granted this scoped permission';
COMMENT ON COLUMN public.permission_scopes.expires_at IS 'Expiration timestamp (NULL = never expires)';
COMMENT ON COLUMN public.permission_scopes.is_active IS 'Whether this scoped permission is currently active';

-- ============================================
-- Verification Queries
-- ============================================

-- Verify table was created
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'permission_scopes') AS column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'permission_scopes';

-- Verify indexes were created
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'permission_scopes'
ORDER BY indexname;

-- Check constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.permission_scopes'::regclass
ORDER BY conname;

-- ============================================
-- Success Message
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Scoped permissions table created successfully!';
    RAISE NOTICE '   - permission_scopes: Stores resource-level permission grants';
    RAISE NOTICE '   - 6 indexes created for optimal query performance';
    RAISE NOTICE '   - 1 check constraint: valid_expiration';
    RAISE NOTICE '';
    RAISE NOTICE 'Phase 2: Scoped Permissions - Database Ready';
END $$;
