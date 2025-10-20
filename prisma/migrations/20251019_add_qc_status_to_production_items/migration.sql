
-- QC & Factory Review PWA Enhancement - Migration 6 of 10
-- Add qc_status column to production_items

ALTER TABLE public.production_items
ADD COLUMN IF NOT EXISTS qc_status TEXT CHECK (qc_status IN ('pending', 'ready_for_qc', 'in_qc', 'passed', 'failed', 'rework_required'));

ALTER TABLE public.production_items
ADD COLUMN IF NOT EXISTS qc_ready_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_production_items_qc_status
  ON public.production_items(qc_status);

CREATE INDEX IF NOT EXISTS idx_production_items_qc_ready
  ON public.production_items(qc_status, qc_ready_at DESC);
