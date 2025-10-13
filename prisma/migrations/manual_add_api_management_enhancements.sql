-- Manual migration for API Management enhancements
-- Created: 2025-01-13
-- Description: Add new tables and fields for API Management module (Phase 1-6)

-- ============================================================================
-- STEP 1: Add new columns to existing api_credentials table
-- ============================================================================

-- Service Template & Access Control (Phase 1 & 2)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='api_credentials' AND column_name='service_template') THEN
    ALTER TABLE "public"."api_credentials" ADD COLUMN "service_template" VARCHAR(100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='api_credentials' AND column_name='allowed_ips') THEN
    ALTER TABLE "public"."api_credentials" ADD COLUMN "allowed_ips" TEXT[] DEFAULT ARRAY[]::TEXT[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='api_credentials' AND column_name='allowed_domains') THEN
    ALTER TABLE "public"."api_credentials" ADD COLUMN "allowed_domains" TEXT[] DEFAULT ARRAY[]::TEXT[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='api_credentials' AND column_name='rate_limit') THEN
    ALTER TABLE "public"."api_credentials" ADD COLUMN "rate_limit" INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='api_credentials' AND column_name='concurrent_limit') THEN
    ALTER TABLE "public"."api_credentials" ADD COLUMN "concurrent_limit" INTEGER;
  END IF;

  -- Zero-Downtime Rotation (Phase 3)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='api_credentials' AND column_name='is_primary') THEN
    ALTER TABLE "public"."api_credentials" ADD COLUMN "is_primary" BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='api_credentials' AND column_name='rotation_partner_id') THEN
    ALTER TABLE "public"."api_credentials" ADD COLUMN "rotation_partner_id" UUID;
  END IF;

  -- Emergency Access (Phase 2)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='api_credentials' AND column_name='emergency_access_enabled') THEN
    ALTER TABLE "public"."api_credentials" ADD COLUMN "emergency_access_enabled" BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='api_credentials' AND column_name='emergency_access_log') THEN
    ALTER TABLE "public"."api_credentials" ADD COLUMN "emergency_access_log" JSONB;
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Create new table: api_credential_audit_logs
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='api_credential_audit_logs') THEN
    CREATE TABLE "public"."api_credential_audit_logs" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "credential_id" UUID NOT NULL,
      "action" VARCHAR(50) NOT NULL,
      "performed_by" UUID NOT NULL,
      "ip_address" VARCHAR(45),
      "user_agent" VARCHAR(500),
      "success" BOOLEAN DEFAULT true,
      "error_message" TEXT,
      "metadata" JSONB,
      "created_at" TIMESTAMPTZ(6) DEFAULT NOW()
    );

    -- Add foreign keys for audit logs
    ALTER TABLE "public"."api_credential_audit_logs"
      ADD CONSTRAINT "fk_audit_credential"
      FOREIGN KEY ("credential_id")
      REFERENCES "public"."api_credentials"("id")
      ON DELETE CASCADE;

    ALTER TABLE "public"."api_credential_audit_logs"
      ADD CONSTRAINT "fk_audit_user"
      FOREIGN KEY ("performed_by")
      REFERENCES "auth"."users"("id")
      ON DELETE SET NULL;

    -- Add indexes for audit logs
    CREATE INDEX "idx_audit_credential" ON "public"."api_credential_audit_logs"("credential_id");
    CREATE INDEX "idx_audit_user" ON "public"."api_credential_audit_logs"("performed_by");
    CREATE INDEX "idx_audit_created" ON "public"."api_credential_audit_logs"("created_at");
    CREATE INDEX "idx_audit_action" ON "public"."api_credential_audit_logs"("action");
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Create new table: api_health_checks
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='api_health_checks') THEN
    CREATE TABLE "public"."api_health_checks" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "credential_id" UUID NOT NULL,
      "endpoint_url" VARCHAR(500) NOT NULL,
      "check_interval" INTEGER DEFAULT 15,
      "timeout" INTEGER DEFAULT 30,
      "expected_status" INTEGER DEFAULT 200,
      "alert_on_failure" BOOLEAN DEFAULT true,
      "is_active" BOOLEAN DEFAULT true,
      "last_check_at" TIMESTAMPTZ(6),
      "last_status_code" INTEGER,
      "last_response_time" INTEGER,
      "consecutive_failures" INTEGER DEFAULT 0,
      "created_at" TIMESTAMPTZ(6) DEFAULT NOW(),
      "updated_at" TIMESTAMPTZ(6) DEFAULT NOW()
    );

    -- Add foreign key for health checks
    ALTER TABLE "public"."api_health_checks"
      ADD CONSTRAINT "fk_health_credential"
      FOREIGN KEY ("credential_id")
      REFERENCES "public"."api_credentials"("id")
      ON DELETE CASCADE;

    -- Add indexes for health checks
    CREATE INDEX "idx_health_credential" ON "public"."api_health_checks"("credential_id");
    CREATE INDEX "idx_health_active" ON "public"."api_health_checks"("is_active");
    CREATE INDEX "idx_health_last_check" ON "public"."api_health_checks"("last_check_at");
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Create new table: api_credential_rotations
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='api_credential_rotations') THEN
    CREATE TABLE "public"."api_credential_rotations" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "credential_id" UUID NOT NULL,
      "rotation_type" VARCHAR(50) NOT NULL,
      "old_credential_id" UUID,
      "performed_by" UUID,
      "success" BOOLEAN DEFAULT true,
      "error_message" TEXT,
      "rollback_at" TIMESTAMPTZ(6),
      "metadata" JSONB,
      "created_at" TIMESTAMPTZ(6) DEFAULT NOW()
    );

    -- Add foreign keys for rotations
    ALTER TABLE "public"."api_credential_rotations"
      ADD CONSTRAINT "fk_rotation_credential"
      FOREIGN KEY ("credential_id")
      REFERENCES "public"."api_credentials"("id")
      ON DELETE CASCADE;

    ALTER TABLE "public"."api_credential_rotations"
      ADD CONSTRAINT "fk_rotation_user"
      FOREIGN KEY ("performed_by")
      REFERENCES "auth"."users"("id")
      ON DELETE SET NULL;

    -- Add indexes for rotations
    CREATE INDEX "idx_rotation_credential" ON "public"."api_credential_rotations"("credential_id");
    CREATE INDEX "idx_rotation_created" ON "public"."api_credential_rotations"("created_at");
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Add RLS (Row Level Security) policies
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE "public"."api_credential_audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."api_health_checks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."api_credential_rotations" ENABLE ROW LEVEL SECURITY;

-- Create policies for api_credential_audit_logs (read-only for admins)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='api_credential_audit_logs' AND policyname='audit_logs_select_policy') THEN
    CREATE POLICY "audit_logs_select_policy" ON "public"."api_credential_audit_logs"
      FOR SELECT
      USING (
        auth.uid() IN (
          SELECT id FROM auth.users WHERE is_super_admin = true
        )
      );
  END IF;
END $$;

-- Create policies for api_health_checks (read/write for admins)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='api_health_checks' AND policyname='health_checks_select_policy') THEN
    CREATE POLICY "health_checks_select_policy" ON "public"."api_health_checks"
      FOR SELECT
      USING (
        auth.uid() IN (
          SELECT id FROM auth.users WHERE is_super_admin = true
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='api_health_checks' AND policyname='health_checks_insert_policy') THEN
    CREATE POLICY "health_checks_insert_policy" ON "public"."api_health_checks"
      FOR INSERT
      WITH CHECK (
        auth.uid() IN (
          SELECT id FROM auth.users WHERE is_super_admin = true
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='api_health_checks' AND policyname='health_checks_update_policy') THEN
    CREATE POLICY "health_checks_update_policy" ON "public"."api_health_checks"
      FOR UPDATE
      USING (
        auth.uid() IN (
          SELECT id FROM auth.users WHERE is_super_admin = true
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='api_health_checks' AND policyname='health_checks_delete_policy') THEN
    CREATE POLICY "health_checks_delete_policy" ON "public"."api_health_checks"
      FOR DELETE
      USING (
        auth.uid() IN (
          SELECT id FROM auth.users WHERE is_super_admin = true
        )
      );
  END IF;
END $$;

-- Create policies for api_credential_rotations (read for admins, write for system)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='api_credential_rotations' AND policyname='rotations_select_policy') THEN
    CREATE POLICY "rotations_select_policy" ON "public"."api_credential_rotations"
      FOR SELECT
      USING (
        auth.uid() IN (
          SELECT id FROM auth.users WHERE is_super_admin = true
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='api_credential_rotations' AND policyname='rotations_insert_policy') THEN
    CREATE POLICY "rotations_insert_policy" ON "public"."api_credential_rotations"
      FOR INSERT
      WITH CHECK (
        auth.uid() IN (
          SELECT id FROM auth.users WHERE is_super_admin = true
        )
      );
  END IF;
END $$;

-- ============================================================================
-- Migration complete
-- ============================================================================
