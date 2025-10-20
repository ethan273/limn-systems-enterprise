
-- QC & Factory Review PWA Enhancement - Migration 5 of 10
-- Create qc_section_results table for tracking section completion

CREATE TABLE IF NOT EXISTS public.qc_section_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES public.qc_inspections(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.qc_template_sections(id) ON DELETE CASCADE,

  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'passed', 'failed')),
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_inspection_section UNIQUE (inspection_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_qc_section_results_inspection
  ON public.qc_section_results(inspection_id);
CREATE INDEX IF NOT EXISTS idx_qc_section_results_status
  ON public.qc_section_results(status);

ALTER TABLE public.qc_section_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view section results"
  ON public.qc_section_results FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage section results"
  ON public.qc_section_results FOR ALL TO authenticated USING (true);
