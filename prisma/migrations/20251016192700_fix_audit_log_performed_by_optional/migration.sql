-- AlterTable: Make performed_by field optional in api_credential_audit_logs
-- This allows audit logs to be preserved even if the associated user is deleted
ALTER TABLE "public"."api_credential_audit_logs" ALTER COLUMN "performed_by" DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN "public"."api_credential_audit_logs"."performed_by" IS 'User who performed the action (nullable to preserve audit logs when user is deleted)';
