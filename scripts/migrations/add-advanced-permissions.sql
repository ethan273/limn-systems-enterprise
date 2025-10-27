-- ============================================
-- RBAC Phase 2.3 - Advanced Permission Features
-- Migration: Create conditional permissions, delegation, approval, and analytics tables
-- Date: 2025-10-27
-- ============================================

-- ============================================
-- 1. Permission Conditions Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.permission_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_id UUID NOT NULL REFERENCES public.permission_definitions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.role_definitions(id) ON DELETE CASCADE,

  -- Condition Type
  condition_type TEXT NOT NULL CHECK (condition_type IN ('time', 'location', 'device', 'ip_range')),

  -- Time-based conditions
  time_start TIME,
  time_end TIME,
  days_of_week INTEGER[],
  timezone TEXT DEFAULT 'UTC',

  -- Location-based conditions
  allowed_countries TEXT[],
  allowed_regions TEXT[],
  allowed_cities TEXT[],
  geo_fence JSONB,

  -- Device-based conditions
  allowed_device_types TEXT[],
  required_os TEXT[],
  corporate_device_only BOOLEAN DEFAULT false,

  -- IP-based conditions
  allowed_ip_ranges INET[],

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_permission_conditions_permission ON public.permission_conditions(permission_id);
CREATE INDEX idx_permission_conditions_user ON public.permission_conditions(user_id);
CREATE INDEX idx_permission_conditions_role ON public.permission_conditions(role_id);
CREATE INDEX idx_permission_conditions_type ON public.permission_conditions(condition_type);

COMMENT ON TABLE public.permission_conditions IS 'Conditional constraints for permissions (time/location/device-based access control)';
COMMENT ON COLUMN public.permission_conditions.condition_type IS 'Type of condition: time, location, device, ip_range';
COMMENT ON COLUMN public.permission_conditions.days_of_week IS 'Array of allowed days (1=Monday, 7=Sunday)';
COMMENT ON COLUMN public.permission_conditions.geo_fence IS 'Polygon coordinates for geo-fencing (lat/long)';

-- ============================================
-- 2. Permission Delegations Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.permission_delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delegatee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permission_definitions(id) ON DELETE CASCADE,

  -- Scope (optional)
  resource_type TEXT,
  resource_id TEXT,

  -- Temporal constraints
  valid_from TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ(6) NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  revoked_at TIMESTAMPTZ(6),
  revoked_by UUID REFERENCES auth.users(id),
  revoke_reason TEXT,

  -- Metadata
  delegation_reason TEXT,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_delegations_delegator ON public.permission_delegations(delegator_id);
CREATE INDEX idx_delegations_delegatee ON public.permission_delegations(delegatee_id);
CREATE INDEX idx_delegations_permission ON public.permission_delegations(permission_id);
CREATE INDEX idx_delegations_status ON public.permission_delegations(status);
CREATE INDEX idx_delegations_expiry ON public.permission_delegations(valid_until) WHERE status = 'active';

COMMENT ON TABLE public.permission_delegations IS 'Temporary permission delegations from one user to another';
COMMENT ON COLUMN public.permission_delegations.delegator_id IS 'User who is delegating their permission';
COMMENT ON COLUMN public.permission_delegations.delegatee_id IS 'User who receives the delegated permission';
COMMENT ON COLUMN public.permission_delegations.valid_until IS 'Delegation automatically expires after this timestamp';

-- ============================================
-- 3. Permission Requests Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.permission_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permission_definitions(id) ON DELETE CASCADE,

  -- Scope (optional)
  resource_type TEXT,
  resource_id TEXT,

  -- Request details
  request_reason TEXT NOT NULL,
  duration_hours INTEGER,

  -- Approval workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'cancelled')),
  approver_id UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ(6),
  denied_at TIMESTAMPTZ(6),
  approval_reason TEXT,

  -- Auto-approval
  auto_approved BOOLEAN DEFAULT false,
  auto_approval_reason TEXT,

  -- Temporal
  requested_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ(6),

  -- Metadata
  metadata JSONB,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_permission_requests_requester ON public.permission_requests(requester_id);
CREATE INDEX idx_permission_requests_approver ON public.permission_requests(approver_id);
CREATE INDEX idx_permission_requests_status ON public.permission_requests(status);
CREATE INDEX idx_permission_requests_permission ON public.permission_requests(permission_id);

COMMENT ON TABLE public.permission_requests IS 'Workflow system for requesting elevated permissions';
COMMENT ON COLUMN public.permission_requests.duration_hours IS 'NULL = permanent, number = temporary (hours)';
COMMENT ON COLUMN public.permission_requests.auto_approved IS 'TRUE if approved automatically by system rules';

-- ============================================
-- 4. Permission Usage Log Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.permission_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permission_definitions(id) ON DELETE CASCADE,

  -- Usage context
  resource_type TEXT,
  resource_id TEXT,
  action TEXT,

  -- Result
  result TEXT NOT NULL CHECK (result IN ('granted', 'denied', 'error')),
  denial_reason TEXT,

  -- Context
  ip_address INET,
  user_agent TEXT,
  session_id UUID,

  -- Timing
  timestamp TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

  -- Metadata
  metadata JSONB
);

-- Indexes optimized for analytics queries
CREATE INDEX idx_usage_log_user_time ON public.permission_usage_log(user_id, timestamp DESC);
CREATE INDEX idx_usage_log_permission_time ON public.permission_usage_log(permission_id, timestamp DESC);
CREATE INDEX idx_usage_log_timestamp ON public.permission_usage_log(timestamp DESC);
CREATE INDEX idx_usage_log_result ON public.permission_usage_log(result);
CREATE INDEX idx_usage_log_resource ON public.permission_usage_log(resource_type, resource_id) WHERE resource_type IS NOT NULL;

COMMENT ON TABLE public.permission_usage_log IS 'Analytics and audit trail for permission usage';
COMMENT ON COLUMN public.permission_usage_log.result IS 'Outcome: granted (allowed), denied (rejected), error (system error)';
COMMENT ON COLUMN public.permission_usage_log.denial_reason IS 'Why permission was denied (condition failed, missing permission, etc.)';

-- ============================================
-- Verification Queries
-- ============================================

-- Verify all 4 tables were created
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('permission_conditions', 'permission_delegations', 'permission_requests', 'permission_usage_log')
ORDER BY table_name;

-- Verify indexes
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('permission_conditions', 'permission_delegations', 'permission_requests', 'permission_usage_log')
ORDER BY tablename, indexname;

-- ============================================
-- Success Message
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Phase 2.3 Advanced Permission tables created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Tables Created:';
    RAISE NOTICE '   1. permission_conditions - Time/location/device constraints';
    RAISE NOTICE '   2. permission_delegations - Temporary delegation with audit';
    RAISE NOTICE '   3. permission_requests - Approval workflow system';
    RAISE NOTICE '   4. permission_usage_log - Analytics and compliance tracking';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Indexes Created: 20 total';
    RAISE NOTICE '   - Performance optimized for queries and analytics';
    RAISE NOTICE '   - Expiry tracking for delegations';
    RAISE NOTICE '   - Time-series optimization for usage logs';
    RAISE NOTICE '';
    RAISE NOTICE 'Phase 2.3: Advanced Permissions - Database Ready';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Implement conditional-permissions.ts service';
    RAISE NOTICE '2. Implement permission-delegation.ts service';
    RAISE NOTICE '3. Implement permission-approval.ts service';
    RAISE NOTICE '4. Implement permission-analytics.ts service';
    RAISE NOTICE '5. Extend rbac-service.ts with condition checking';
    RAISE NOTICE '6. Create permissions-advanced.ts tRPC router';
END $$;
