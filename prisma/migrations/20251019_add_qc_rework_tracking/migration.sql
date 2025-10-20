
-- QC & Factory Review PWA Enhancement - Migration 10 of 10
-- Add rework tracking columns to qc_inspections

ALTER TABLE public.qc_inspections
ADD COLUMN IF NOT EXISTS rework_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS idempotency_key UUID UNIQUE,
ADD COLUMN IF NOT EXISTS parent_inspection_id UUID REFERENCES public.qc_inspections(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_qc_inspections_rework
  ON public.qc_inspections(parent_inspection_id);

CREATE INDEX IF NOT EXISTS idx_qc_inspections_idempotency
  ON public.qc_inspections(idempotency_key);
