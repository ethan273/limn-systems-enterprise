-- ================================================================
-- Migration: Create invoice_templates table
-- Date: 2025-10-03
-- Purpose: Add invoice PDF template system with customizable branding
-- ================================================================

-- Create invoice_templates table
CREATE TABLE IF NOT EXISTS public.invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('standard', 'proforma', 'credit_note')),
  is_default BOOLEAN DEFAULT false,

  -- Branding
  company_logo_url TEXT,
  company_name TEXT DEFAULT 'Limn Systems',
  company_address TEXT,
  company_city_state_zip TEXT,
  company_phone TEXT,
  company_email TEXT,
  company_website TEXT,

  -- Typography
  font_family TEXT DEFAULT 'Roboto',
  font_size_base INTEGER DEFAULT 10,
  font_size_heading INTEGER DEFAULT 24,
  font_size_subheading INTEGER DEFAULT 14,

  -- Colors (hex codes)
  color_primary TEXT DEFAULT '#2563eb',
  color_secondary TEXT DEFAULT '#64748b',
  color_text TEXT DEFAULT '#0f172a',
  color_border TEXT DEFAULT '#e2e8f0',
  color_background TEXT DEFAULT '#ffffff',

  -- Layout Options
  show_company_logo BOOLEAN DEFAULT true,
  show_payment_terms BOOLEAN DEFAULT true,
  show_bank_details BOOLEAN DEFAULT false,
  show_notes_section BOOLEAN DEFAULT true,
  show_tax_summary BOOLEAN DEFAULT true,

  -- Payment Terms
  default_payment_terms TEXT DEFAULT 'Net 30',
  bank_name TEXT,
  bank_account_number TEXT,
  bank_routing_number TEXT,
  bank_swift_code TEXT,

  -- Custom Fields
  footer_text TEXT,
  notes_text TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create index on template_type and is_default for faster queries
CREATE INDEX IF NOT EXISTS idx_invoice_templates_type ON public.invoice_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_invoice_templates_default ON public.invoice_templates(is_default) WHERE is_default = true;

-- Enable Row Level Security
ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "invoice_templates_select" ON public.invoice_templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "invoice_templates_insert" ON public.invoice_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "invoice_templates_update" ON public.invoice_templates
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "invoice_templates_delete" ON public.invoice_templates
  FOR DELETE
  TO authenticated
  USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_invoice_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoice_templates_updated_at
  BEFORE UPDATE ON public.invoice_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_invoice_templates_updated_at();

-- Comment on table
COMMENT ON TABLE public.invoice_templates IS 'Invoice PDF templates with customizable branding, typography, colors, and layout options';
