-- Migration: Add flipbook_conversions table for tracking flipbook-to-order conversions
-- Date: 2025-10-28
-- Description: Enables conversion tracking analytics linking flipbook views to orders

-- Create flipbook_conversions table
CREATE TABLE IF NOT EXISTS public.flipbook_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flipbook_id UUID NOT NULL,
    session_id UUID NOT NULL,
    order_id UUID NOT NULL,
    user_id UUID,
    converted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revenue_amount DECIMAL(12, 2),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Foreign keys
    CONSTRAINT fk_flipbook_conversions_flipbook
        FOREIGN KEY (flipbook_id)
        REFERENCES public.flipbooks(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_flipbook_conversions_order
        FOREIGN KEY (order_id)
        REFERENCES public.orders(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_flipbook_conversions_user
        FOREIGN KEY (user_id)
        REFERENCES public.user_profiles(id)
        ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_flipbook_conversions_flipbook_id ON public.flipbook_conversions(flipbook_id);
CREATE INDEX IF NOT EXISTS idx_flipbook_conversions_order_id ON public.flipbook_conversions(order_id);
CREATE INDEX IF NOT EXISTS idx_flipbook_conversions_session_id ON public.flipbook_conversions(session_id);
CREATE INDEX IF NOT EXISTS idx_flipbook_conversions_user_id ON public.flipbook_conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_flipbook_conversions_converted_at ON public.flipbook_conversions(converted_at DESC);
CREATE INDEX IF NOT EXISTS idx_flipbook_conversions_created_at ON public.flipbook_conversions(created_at DESC);

-- Add comment
COMMENT ON TABLE public.flipbook_conversions IS 'Tracks conversions from flipbook views to actual orders for analytics';

-- Enable Row Level Security (RLS) to match other tables
ALTER TABLE public.flipbook_conversions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for authenticated users to read their own conversions
CREATE POLICY "Users can view their own conversions"
    ON public.flipbook_conversions
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR
        auth.uid() IN (
            SELECT id FROM public.user_profiles
            WHERE user_type IN ('admin', 'employee')
        )
    );

-- Create RLS policy for service role to manage conversions
CREATE POLICY "Service role can manage all conversions"
    ON public.flipbook_conversions
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Verify table was created
SELECT 'flipbook_conversions table created successfully' AS status;
