-- QC & Factory Review PWA Enhancement - Migration 1 of 10
-- Create qc_capture_templates table for template management
-- Created: 2025-10-19
-- Part of: Phase 1 - Database Infrastructure

-- =============================================================================
-- QC CAPTURE TEMPLATES TABLE
-- =============================================================================
-- Stores template definitions for both QC and Factory Review workflows
-- Each template defines the 9-section quality checklist structure

CREATE TABLE IF NOT EXISTS public.qc_capture_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('qc', 'factory_review')),
  description TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT unique_template_type_default UNIQUE (template_type, is_default)
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_qc_capture_templates_type
  ON public.qc_capture_templates(template_type);

CREATE INDEX IF NOT EXISTS idx_qc_capture_templates_active
  ON public.qc_capture_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_qc_capture_templates_default
  ON public.qc_capture_templates(is_default, template_type);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================
ALTER TABLE public.qc_capture_templates ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read templates
CREATE POLICY "Users can view templates"
  ON public.qc_capture_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to manage templates (full CRUD)
CREATE POLICY "Admins can manage templates"
  ON public.qc_capture_templates
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
-- SEED DATA: Default Templates
-- =============================================================================

-- Default QC Template
INSERT INTO public.qc_capture_templates (
  template_name,
  template_type,
  description,
  version,
  is_active,
  is_default
) VALUES (
  'Default QC Inspection Checklist',
  'qc',
  'Standard 9-section quality control checklist for production items',
  1,
  true,
  true
) ON CONFLICT DO NOTHING;

-- Default Factory Review Template
INSERT INTO public.qc_capture_templates (
  template_name,
  template_type,
  description,
  version,
  is_active,
  is_default
) VALUES (
  'Default Factory Review Checklist',
  'factory_review',
  'Standard 9-section factory review checklist for prototypes',
  1,
  true,
  true
) ON CONFLICT DO NOTHING;

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================
-- Run this to verify table was created:
-- SELECT id, template_name, template_type, is_default, is_active
-- FROM public.qc_capture_templates
-- ORDER BY template_type;

-- Expected: 2 rows (qc + factory_review)
