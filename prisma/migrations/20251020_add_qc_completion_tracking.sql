-- Migration: Add QC Completion Tracking
-- Description: Adds QC tester tracking to production items for performance metrics
-- Date: 2025-10-20

-- Add qc_completed_by field to production_items to track which QC tester completed inspection
ALTER TABLE production_items
  ADD COLUMN IF NOT EXISTS qc_completed_by UUID REFERENCES partner_contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS qc_completed_at TIMESTAMPTZ;

-- Add index for performance queries
CREATE INDEX IF NOT EXISTS idx_production_items_qc_completed_by
  ON production_items(qc_completed_by)
  WHERE qc_completed_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_production_items_qc_completed_at
  ON production_items(qc_completed_at DESC)
  WHERE qc_completed_at IS NOT NULL;

-- Add comments
COMMENT ON COLUMN production_items.qc_completed_by IS 'Reference to partner_contacts.id of QC tester who completed the inspection';
COMMENT ON COLUMN production_items.qc_completed_at IS 'Timestamp when QC inspection was completed';
