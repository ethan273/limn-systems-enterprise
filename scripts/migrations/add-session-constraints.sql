-- ============================================
-- RBAC Phase 2.2 - Session Constraints
-- Migration: Create session_tracking table (parallel to auth.sessions)
-- Date: 2025-10-27
-- ============================================
-- Note: Cannot modify auth.sessions directly (Supabase Auth owned)
-- Creating separate tracking table instead
-- ============================================

-- Create session_tracking table
CREATE TABLE IF NOT EXISTS public.session_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  user_id UUID NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  geo_location JSONB,
  is_suspicious BOOLEAN DEFAULT false,
  login_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  logout_at TIMESTAMPTZ(6),
  session_metadata JSONB,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_tracking_session ON public.session_tracking(session_id);
CREATE INDEX IF NOT EXISTS idx_session_tracking_user ON public.session_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_session_tracking_ip ON public.session_tracking(ip_address);
CREATE INDEX IF NOT EXISTS idx_session_tracking_active ON public.session_tracking(user_id) WHERE logout_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_session_tracking_suspicious ON public.session_tracking(is_suspicious) WHERE is_suspicious = true;
CREATE INDEX IF NOT EXISTS idx_session_tracking_last_activity ON public.session_tracking(last_activity_at);

-- Add comments for documentation
COMMENT ON TABLE public.session_tracking IS 'Tracks session metadata for IP validation, concurrent session limits, and security monitoring';
COMMENT ON COLUMN public.session_tracking.session_id IS 'Reference to auth.sessions.id';
COMMENT ON COLUMN public.session_tracking.user_id IS 'Reference to auth.users.id';
COMMENT ON COLUMN public.session_tracking.ip_address IS 'IP address of the client when session was created';
COMMENT ON COLUMN public.session_tracking.user_agent IS 'User agent string of the client browser/device';
COMMENT ON COLUMN public.session_tracking.geo_location IS 'Geo-location data (city, country, lat/long) from IP lookup';
COMMENT ON COLUMN public.session_tracking.is_suspicious IS 'Flagged as suspicious activity (IP change, geo anomaly, unusual behavior)';
COMMENT ON COLUMN public.session_tracking.login_at IS 'Timestamp when session was created';
COMMENT ON COLUMN public.session_tracking.last_activity_at IS 'Last time this session was used (updated on every request)';
COMMENT ON COLUMN public.session_tracking.logout_at IS 'Timestamp when session was terminated (NULL = still active)';
COMMENT ON COLUMN public.session_tracking.session_metadata IS 'Additional session metadata (device type, browser, OS, screen resolution)';

-- ============================================
-- Verification Queries
-- ============================================

-- Verify table was created
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'session_tracking' AND table_schema = 'public') AS column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'session_tracking';

-- Verify indexes were created
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'session_tracking'
ORDER BY indexname;

-- Count active sessions by user
SELECT
    user_id,
    COUNT(*) as active_sessions,
    MAX(last_activity_at) as last_activity
FROM public.session_tracking
WHERE logout_at IS NULL
GROUP BY user_id
ORDER BY active_sessions DESC
LIMIT 10;

-- Check for suspicious sessions
SELECT
    id,
    user_id,
    ip_address,
    is_suspicious,
    last_activity_at,
    login_at
FROM public.session_tracking
WHERE is_suspicious = true
  AND logout_at IS NULL
ORDER BY last_activity_at DESC
LIMIT 10;

-- ============================================
-- Success Message
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Session tracking table created successfully!';
    RAISE NOTICE '   - session_tracking: Parallel table to auth.sessions';
    RAISE NOTICE '   - session_id: Links to auth.sessions.id';
    RAISE NOTICE '   - user_id: Links to auth.users.id';
    RAISE NOTICE '   - ip_address: Track client IP for validation';
    RAISE NOTICE '   - user_agent: Track client browser/device';
    RAISE NOTICE '   - geo_location: Track geographic location';
    RAISE NOTICE '   - is_suspicious: Flag suspicious sessions';
    RAISE NOTICE '   - last_activity_at: Track session activity';
    RAISE NOTICE '   - logout_at: Track session termination';
    RAISE NOTICE '   - session_metadata: Store additional metadata';
    RAISE NOTICE '   - 6 indexes created for optimal query performance';
    RAISE NOTICE '';
    RAISE NOTICE 'Phase 2.2: Session Constraints - Database Ready';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Implement session-service.ts for IP validation';
    RAISE NOTICE '2. Update auth middleware to validate sessions';
    RAISE NOTICE '3. Implement concurrent session limits';
    RAISE NOTICE '4. Create session management UI';
END $$;
