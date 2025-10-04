-- ================================================================
-- Migration: Update invoices table for PDF generation
-- Date: 2025-10-03
-- Purpose: Add invoice header fields and PDF-related columns
-- ================================================================

-- Add essential invoice header fields
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS invoice_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS invoice_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id),
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id),
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id),
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled')),

  -- Financial fields
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_total NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_total NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_due NUMERIC(12,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,

  -- PDF generation fields
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.invoice_templates(id),
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMPTZ,

  -- Custom per-invoice fields
  ADD COLUMN IF NOT EXISTS invoice_notes TEXT,
  ADD COLUMN IF NOT EXISTS payment_terms TEXT DEFAULT 'Net 30',
  ADD COLUMN IF NOT EXISTS internal_notes TEXT,

  -- QuickBooks integration
  ADD COLUMN IF NOT EXISTS quickbooks_invoice_id TEXT,
  ADD COLUMN IF NOT EXISTS quickbooks_sync_date TIMESTAMPTZ;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON public.invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON public.invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON public.invoices(invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_template_id ON public.invoices(template_id);

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  invoice_num TEXT;
BEGIN
  -- Get the highest existing invoice number (assuming format INV-YYYY-NNNNN)
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-[0-9]{4}-([0-9]{5})') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.invoices
  WHERE invoice_number LIKE 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-%';

  -- Generate new invoice number
  invoice_num := 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(next_number::TEXT, 5, '0');

  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate invoice number if not provided
CREATE OR REPLACE FUNCTION public.set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := public.generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoices_set_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.set_invoice_number();

-- Function to auto-calculate invoice status based on payments
CREATE OR REPLACE FUNCTION public.update_invoice_status()
RETURNS TRIGGER AS $$
DECLARE
  invoice_total NUMERIC(12,2);
  invoice_paid NUMERIC(12,2);
  invoice_due_date DATE;
  new_status TEXT;
BEGIN
  -- Get invoice details
  SELECT total_amount, amount_paid, due_date INTO invoice_total, invoice_paid, invoice_due_date
  FROM public.invoices
  WHERE id = NEW.invoice_id OR id = OLD.invoice_id;

  -- Determine status
  IF invoice_paid >= invoice_total THEN
    new_status := 'paid';
  ELSIF invoice_paid > 0 AND invoice_paid < invoice_total THEN
    new_status := 'partial';
  ELSIF invoice_due_date < CURRENT_DATE THEN
    new_status := 'overdue';
  ELSE
    new_status := 'pending';
  END IF;

  -- Update invoice status
  UPDATE public.invoices
  SET status = new_status
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update invoice status when payment allocations change
CREATE TRIGGER payment_allocations_update_invoice_status
  AFTER INSERT OR UPDATE OR DELETE ON public.payment_allocations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_invoice_status();

-- Comment on table
COMMENT ON COLUMN public.invoices.invoice_number IS 'Auto-generated invoice number (INV-YYYY-NNNNN format)';
COMMENT ON COLUMN public.invoices.status IS 'Auto-calculated from payments: pending, partial, paid, overdue, cancelled';
COMMENT ON COLUMN public.invoices.balance_due IS 'Auto-calculated: total_amount - amount_paid';
