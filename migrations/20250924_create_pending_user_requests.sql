-- Create pending_user_requests table for the NEW limn-systems-enterprise app
CREATE TABLE IF NOT EXISTS public.pending_user_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  company_name VARCHAR(255),
  phone VARCHAR(20),
  user_type VARCHAR(50) CHECK (user_type IN ('customer', 'contractor', 'manufacturer', 'designer')),
  reason_for_access TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
  admin_notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pending_user_requests_email ON public.pending_user_requests(email);
CREATE INDEX IF NOT EXISTS idx_pending_user_requests_status ON public.pending_user_requests(status);
CREATE INDEX IF NOT EXISTS idx_pending_user_requests_requested_at ON public.pending_user_requests(requested_at);

-- Enable RLS
ALTER TABLE public.pending_user_requests ENABLE ROW LEVEL SECURITY;

-- Policy for public to submit requests
CREATE POLICY "Public can insert pending requests" ON public.pending_user_requests
  FOR INSERT TO anon
  WITH CHECK (true);

-- Policy for admins to view all requests
CREATE POLICY "Admins can view all pending requests" ON public.pending_user_requests
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.user_type IN ('super_admin', 'employee')
    )
  );

-- Policy for admins to update requests
CREATE POLICY "Admins can update pending requests" ON public.pending_user_requests
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.user_type IN ('super_admin', 'employee')
    )
  );
