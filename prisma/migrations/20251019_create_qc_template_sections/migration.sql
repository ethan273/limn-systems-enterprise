-- QC & Factory Review PWA Enhancement - Migration 2 of 10
-- Create qc_template_sections table for 9-section structure
-- Created: 2025-10-19
-- Part of: Phase 1 - Database Infrastructure

-- =============================================================================
-- QC TEMPLATE SECTIONS TABLE
-- =============================================================================
-- Stores the 9 quality sections for each template
-- Each section contains multiple checkpoints

CREATE TABLE IF NOT EXISTS public.qc_template_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.qc_capture_templates(id) ON DELETE CASCADE,

  -- Section identification
  section_number INTEGER NOT NULL CHECK (section_number BETWEEN 1 AND 9),
  section_name TEXT NOT NULL,
  section_description TEXT,

  -- Conditional logic (JSONB for flexibility)
  -- Example: {"show_if": {"hasUpholstery": true}}
  conditional_logic JSONB,

  -- Display order
  display_order INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_template_section UNIQUE (template_id, section_number)
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_qc_template_sections_template
  ON public.qc_template_sections(template_id);

CREATE INDEX IF NOT EXISTS idx_qc_template_sections_number
  ON public.qc_template_sections(section_number);

CREATE INDEX IF NOT EXISTS idx_qc_template_sections_display_order
  ON public.qc_template_sections(template_id, display_order);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================
ALTER TABLE public.qc_template_sections ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read sections
CREATE POLICY "Users can view template sections"
  ON public.qc_template_sections
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to manage sections
CREATE POLICY "Admins can manage template sections"
  ON public.qc_template_sections
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'admin'
    )
  );

-- =============================================================================
-- SEED DATA: 9 Sections for Default QC Template
-- =============================================================================

-- Get the default QC template ID
DO $$
DECLARE
  v_qc_template_id UUID;
  v_fr_template_id UUID;
BEGIN
  -- Get QC template ID
  SELECT id INTO v_qc_template_id
  FROM public.qc_capture_templates
  WHERE template_type = 'qc' AND is_default = true
  LIMIT 1;

  -- Get Factory Review template ID
  SELECT id INTO v_fr_template_id
  FROM public.qc_capture_templates
  WHERE template_type = 'factory_review' AND is_default = true
  LIMIT 1;

  -- Insert 9 sections for QC template
  IF v_qc_template_id IS NOT NULL THEN
    INSERT INTO public.qc_template_sections (template_id, section_number, section_name, section_description, display_order) VALUES
      (v_qc_template_id, 1, 'Identification & Setup', 'Verify item matches order and specifications before detailed inspection', 1),
      (v_qc_template_id, 2, 'Structural Integrity', 'Assess structural soundness and stability', 2),
      (v_qc_template_id, 3, 'Precision & Craft', 'Evaluate craftsmanship and attention to detail', 3),
      (v_qc_template_id, 4, 'Surfaces & Finish Quality', 'Assess finish application and surface quality', 4),
      (v_qc_template_id, 5, 'Dimensions / Tolerances', 'Verify dimensions within acceptable tolerances', 5),
      (v_qc_template_id, 6, 'Upholstery & Cushions', 'Assess upholstery quality and craftsmanship', 6),
      (v_qc_template_id, 7, 'Functionality', 'Test all functional elements', 7),
      (v_qc_template_id, 8, 'Safety & Cleanliness', 'Ensure safety and presentation', 8),
      (v_qc_template_id, 9, 'Packaging Readiness', 'Ensure item ready for packing', 9)
    ON CONFLICT (template_id, section_number) DO NOTHING;
  END IF;

  -- Insert 9 sections for Factory Review template (same structure, slight wording differences)
  IF v_fr_template_id IS NOT NULL THEN
    INSERT INTO public.qc_template_sections (template_id, section_number, section_name, section_description, display_order) VALUES
      (v_fr_template_id, 1, 'Identification & Setup', 'Verify prototype matches design brief and specifications', 1),
      (v_fr_template_id, 2, 'Structural Integrity', 'Assess structural soundness and stability', 2),
      (v_fr_template_id, 3, 'Precision & Craft', 'Evaluate craftsmanship and attention to detail', 3),
      (v_fr_template_id, 4, 'Surfaces & Finish Quality', 'Assess finish application and surface quality', 4),
      (v_fr_template_id, 5, 'Dimensions / Tolerances', 'Verify dimensions within acceptable tolerances', 5),
      (v_fr_template_id, 6, 'Upholstery & Cushions', 'Assess upholstery quality and craftsmanship', 6),
      (v_fr_template_id, 7, 'Functionality', 'Test all functional elements', 7),
      (v_fr_template_id, 8, 'Safety & Cleanliness', 'Ensure safety and presentation', 8),
      (v_fr_template_id, 9, 'Packaging Readiness', 'Ensure item ready for client presentation', 9)
    ON CONFLICT (template_id, section_number) DO NOTHING;
  END IF;
END $$;

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================
-- Run this to verify sections were created:
-- SELECT s.section_number, s.section_name, t.template_type
-- FROM public.qc_template_sections s
-- JOIN public.qc_capture_templates t ON s.template_id = t.id
-- ORDER BY t.template_type, s.section_number;

-- Expected: 18 rows (9 for qc + 9 for factory_review)
