-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Users can read their own roles" ON public.user_roles;

-- Create policy: Users can read their own roles
-- This allows middleware (using anon key) to query user_roles for the authenticated user
CREATE POLICY "Users can read their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Optional: Allow service role to bypass RLS (already default behavior)
-- No additional policy needed for service role
