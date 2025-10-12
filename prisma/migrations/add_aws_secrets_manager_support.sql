-- Migration: Add AWS Secrets Manager Support
-- Date: 2025-10-11
-- Description: Extends api_credentials table to support external secrets managers (AWS, Vault, Azure)

-- Add storage type and external reference fields
ALTER TABLE api_credentials
  ADD COLUMN IF NOT EXISTS storage_type VARCHAR(20) DEFAULT 'local',
  ADD COLUMN IF NOT EXISTS secret_arn TEXT,
  ADD COLUMN IF NOT EXISTS vault_path TEXT,
  ADD COLUMN IF NOT EXISTS azure_key_vault_id TEXT,
  ADD COLUMN IF NOT EXISTS auto_rotation_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS rotation_interval_days INTEGER DEFAULT 90,
  ADD COLUMN IF NOT EXISTS last_rotated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_rotation_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS aws_region VARCHAR(50) DEFAULT 'us-west-1';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_credentials_storage_type ON api_credentials(storage_type);
CREATE INDEX IF NOT EXISTS idx_api_credentials_auto_rotation ON api_credentials(auto_rotation_enabled) WHERE auto_rotation_enabled = true;
CREATE INDEX IF NOT EXISTS idx_api_credentials_next_rotation ON api_credentials(next_rotation_at) WHERE next_rotation_at IS NOT NULL;

-- Add check constraint for storage type
ALTER TABLE api_credentials
  ADD CONSTRAINT chk_storage_type
  CHECK (storage_type IN ('local', 'aws', 'vault', 'azure'));

-- Add check constraint: if storage_type = 'aws', secret_arn must be set
ALTER TABLE api_credentials
  ADD CONSTRAINT chk_aws_secret_arn
  CHECK (
    (storage_type = 'aws' AND secret_arn IS NOT NULL) OR
    (storage_type != 'aws')
  );

-- Add check constraint: if auto_rotation_enabled, storage must be 'aws'
ALTER TABLE api_credentials
  ADD CONSTRAINT chk_auto_rotation_storage
  CHECK (
    (auto_rotation_enabled = true AND storage_type = 'aws') OR
    (auto_rotation_enabled = false)
  );

-- Create function to calculate next rotation date
CREATE OR REPLACE FUNCTION calculate_next_rotation_date(
  last_rotated TIMESTAMPTZ,
  interval_days INTEGER
) RETURNS TIMESTAMPTZ AS $$
BEGIN
  IF last_rotated IS NULL THEN
    RETURN NOW() + (interval_days || ' days')::INTERVAL;
  ELSE
    RETURN last_rotated + (interval_days || ' days')::INTERVAL;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger to auto-update next_rotation_at
CREATE OR REPLACE FUNCTION update_next_rotation_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.auto_rotation_enabled = true THEN
    NEW.next_rotation_at := calculate_next_rotation_date(
      NEW.last_rotated_at,
      NEW.rotation_interval_days
    );
  ELSE
    NEW.next_rotation_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_next_rotation
  BEFORE INSERT OR UPDATE OF auto_rotation_enabled, last_rotated_at, rotation_interval_days
  ON api_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_next_rotation_date();

-- Create audit log table for AWS operations
CREATE TABLE IF NOT EXISTS api_credentials_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id UUID NOT NULL REFERENCES api_credentials(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'rotated', 'accessed'
  storage_type VARCHAR(20),
  performed_by UUID REFERENCES users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_log_credential ON api_credentials_audit_log(credential_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON api_credentials_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_performed_at ON api_credentials_audit_log(performed_at DESC);

-- Create AWS cost tracking table
CREATE TABLE IF NOT EXISTS aws_secrets_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id UUID REFERENCES api_credentials(id) ON DELETE CASCADE,
  operation_type VARCHAR(50), -- 'GetSecretValue', 'CreateSecret', 'UpdateSecret', 'DeleteSecret'
  api_calls INTEGER DEFAULT 0,
  estimated_cost DECIMAL(10, 4) DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aws_usage_credential ON aws_secrets_usage(credential_id);
CREATE INDEX IF NOT EXISTS idx_aws_usage_period ON aws_secrets_usage(period_start, period_end);

-- Add comments for documentation
COMMENT ON COLUMN api_credentials.storage_type IS 'Where the credential is stored: local (encrypted in DB), aws (AWS Secrets Manager), vault (HashiCorp Vault), azure (Azure Key Vault)';
COMMENT ON COLUMN api_credentials.secret_arn IS 'AWS Secrets Manager ARN (only for storage_type=aws)';
COMMENT ON COLUMN api_credentials.vault_path IS 'HashiCorp Vault path (only for storage_type=vault)';
COMMENT ON COLUMN api_credentials.auto_rotation_enabled IS 'Enable automatic rotation via AWS Lambda (AWS only)';
COMMENT ON COLUMN api_credentials.rotation_interval_days IS 'How often to rotate (default 90 days)';
COMMENT ON COLUMN api_credentials.next_rotation_at IS 'Automatically calculated next rotation date';

COMMENT ON TABLE api_credentials_audit_log IS 'Audit trail for all credential operations';
COMMENT ON TABLE aws_secrets_usage IS 'Track AWS Secrets Manager API usage for cost monitoring';
