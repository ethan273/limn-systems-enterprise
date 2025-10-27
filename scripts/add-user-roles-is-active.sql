-- Add is_active column to user_roles table
-- This enables soft-delete functionality for role assignments

-- Add the column with default true (all existing roles remain active)
ALTER TABLE public.user_roles
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_roles_is_active ON public.user_roles(is_active);

-- Add comment for documentation
COMMENT ON COLUMN public.user_roles.is_active IS 'Indicates if this role assignment is active. Use for soft-delete and temporary role suspension.';

-- Verify the change
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_roles'
  AND column_name = 'is_active';
