
-- QC & Factory Review PWA Enhancement - Migration 7 of 10
-- Add review_status column to prototype_production

ALTER TABLE public.prototype_production
ADD COLUMN IF NOT EXISTS review_status TEXT CHECK (review_status IN ('pending', 'ready_for_review', 'in_review', 'approved', 'rejected', 'revision_required'));

ALTER TABLE public.prototype_production
ADD COLUMN IF NOT EXISTS review_ready_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_prototype_production_review_status
  ON public.prototype_production(review_status);

CREATE INDEX IF NOT EXISTS idx_prototype_production_review_ready
  ON public.prototype_production(review_status, review_ready_at DESC);
