
-- QC & Factory Review PWA Enhancement - Migration 4 of 10
-- Create qc_checkpoint_results table for tracking individual checkpoint outcomes

CREATE TABLE IF NOT EXISTS public.qc_checkpoint_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES public.qc_inspections(id) ON DELETE CASCADE,
  checkpoint_id UUID NOT NULL REFERENCES public.qc_template_checkpoints(id) ON DELETE CASCADE,

  status TEXT NOT NULL CHECK (status IN ('pass', 'fail', 'issue', 'na')),
  severity TEXT CHECK (severity IN ('minor', 'major', 'critical')),
  note TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  CONSTRAINT unique_inspection_checkpoint UNIQUE (inspection_id, checkpoint_id)
);

CREATE INDEX IF NOT EXISTS idx_qc_checkpoint_results_inspection
  ON public.qc_checkpoint_results(inspection_id);
CREATE INDEX IF NOT EXISTS idx_qc_checkpoint_results_checkpoint
  ON public.qc_checkpoint_results(checkpoint_id);
CREATE INDEX IF NOT EXISTS idx_qc_checkpoint_results_status
  ON public.qc_checkpoint_results(status);

ALTER TABLE public.qc_checkpoint_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view checkpoint results"
  ON public.qc_checkpoint_results FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage checkpoint results"
  ON public.qc_checkpoint_results FOR ALL TO authenticated USING (true);
