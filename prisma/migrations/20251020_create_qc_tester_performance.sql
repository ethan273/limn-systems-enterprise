-- Migration: Create QC Tester Performance Tracking
-- Description: Tracks performance metrics for QC testers from sourcing companies
-- Date: 2025-10-20

-- Create qc_tester_performance table
CREATE TABLE IF NOT EXISTS qc_tester_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qc_tester_contact_id UUID NOT NULL REFERENCES partner_contacts(id) ON DELETE CASCADE,
  sourcing_partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Inspection metrics
  inspections_completed INT DEFAULT 0,
  inspections_passed INT DEFAULT 0,
  inspections_failed INT DEFAULT 0,
  defects_found INT DEFAULT 0,
  critical_defects INT DEFAULT 0,
  minor_defects INT DEFAULT 0,

  -- Efficiency metrics
  average_inspection_time_mins INT,
  fastest_inspection_mins INT,
  slowest_inspection_mins INT,
  total_inspection_time_mins INT DEFAULT 0,

  -- Quality metrics
  accuracy_score DECIMAL(3,2), -- 0.00-5.00 (based on re-inspections or audits)
  thoroughness_score DECIMAL(3,2), -- 0.00-5.00
  consistency_score DECIMAL(3,2), -- 0.00-5.00
  overall_rating DECIMAL(3,2), -- 0.00-5.00 (average of above scores)

  -- Activity metrics
  orders_worked INT DEFAULT 0,
  factories_visited TEXT[], -- Array of factory partner IDs
  active_days INT DEFAULT 0,
  total_items_inspected INT DEFAULT 0,

  -- Feedback and ratings
  factory_feedback_avg DECIMAL(3,2), -- Average rating from factories
  internal_feedback_avg DECIMAL(3,2), -- Average rating from internal team
  client_feedback_avg DECIMAL(3,2), -- Average rating from clients
  feedback_count INT DEFAULT 0,

  -- Financial
  total_fees_earned DECIMAL(12,2) DEFAULT 0.00,
  bonus_earned DECIMAL(12,2) DEFAULT 0.00,

  -- Notes and highlights
  notes TEXT,
  highlights TEXT[], -- Array of notable achievements or incidents
  training_completed TEXT[], -- Array of training courses completed in period

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_qc_tester_period UNIQUE(qc_tester_contact_id, period_start, period_end),
  CONSTRAINT valid_period CHECK (period_end > period_start),
  CONSTRAINT valid_scores CHECK (
    accuracy_score IS NULL OR (accuracy_score >= 0 AND accuracy_score <= 5) AND
    thoroughness_score IS NULL OR (thoroughness_score >= 0 AND thoroughness_score <= 5) AND
    consistency_score IS NULL OR (consistency_score >= 0 AND consistency_score <= 5) AND
    overall_rating IS NULL OR (overall_rating >= 0 AND overall_rating <= 5)
  )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_qc_performance_tester ON qc_tester_performance(qc_tester_contact_id);
CREATE INDEX IF NOT EXISTS idx_qc_performance_partner ON qc_tester_performance(sourcing_partner_id);
CREATE INDEX IF NOT EXISTS idx_qc_performance_period ON qc_tester_performance(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_qc_performance_period_lookup ON qc_tester_performance(period_start DESC, period_end DESC);

-- Add comments
COMMENT ON TABLE qc_tester_performance IS 'Performance metrics for QC testers tracked by time period';
COMMENT ON COLUMN qc_tester_performance.qc_tester_contact_id IS 'Reference to partner_contacts.id for the QC tester';
COMMENT ON COLUMN qc_tester_performance.sourcing_partner_id IS 'Reference to partners.id for the sourcing company';
COMMENT ON COLUMN qc_tester_performance.period_start IS 'Start of performance tracking period';
COMMENT ON COLUMN qc_tester_performance.period_end IS 'End of performance tracking period';
COMMENT ON COLUMN qc_tester_performance.inspections_completed IS 'Total number of inspections completed';
COMMENT ON COLUMN qc_tester_performance.inspections_passed IS 'Number of inspections that passed QC';
COMMENT ON COLUMN qc_tester_performance.inspections_failed IS 'Number of inspections that failed QC';
COMMENT ON COLUMN qc_tester_performance.defects_found IS 'Total number of defects identified';
COMMENT ON COLUMN qc_tester_performance.critical_defects IS 'Number of critical defects found';
COMMENT ON COLUMN qc_tester_performance.accuracy_score IS 'Accuracy rating (0-5) based on audit re-inspections';
COMMENT ON COLUMN qc_tester_performance.thoroughness_score IS 'Thoroughness rating (0-5) based on inspection completeness';
COMMENT ON COLUMN qc_tester_performance.overall_rating IS 'Overall performance rating (0-5)';
COMMENT ON COLUMN qc_tester_performance.factories_visited IS 'Array of factory partner IDs visited during period';
COMMENT ON COLUMN qc_tester_performance.factory_feedback_avg IS 'Average feedback rating from factories';
COMMENT ON COLUMN qc_tester_performance.internal_feedback_avg IS 'Average feedback rating from internal team';
