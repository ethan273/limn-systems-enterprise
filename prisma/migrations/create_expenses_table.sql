-- Create expenses table for financial tracking
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(255) NOT NULL,
  subcategory VARCHAR(255),
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  vendor VARCHAR(255),
  payment_method VARCHAR(100),
  reference_number VARCHAR(100),
  expense_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  approved_by UUID,
  approval_status VARCHAR(50) DEFAULT 'pending'
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_approval_status ON expenses(approval_status);

-- Insert sample expense data for testing
INSERT INTO expenses (category, subcategory, amount, description, vendor, payment_method, expense_date, approval_status)
VALUES
  -- Materials expenses
  ('Materials', 'Wood', 12500.00, 'Oak wood planks for furniture production', 'Premium Lumber Co', 'wire_transfer', '2025-09-15', 'approved'),
  ('Materials', 'Fabric', 8750.50, 'Upholstery fabric bulk order', 'Textile Supplies Inc', 'credit_card', '2025-09-18', 'approved'),
  ('Materials', 'Hardware', 3200.00, 'Hinges, screws, and assembly hardware', 'Hardware Direct', 'invoice', '2025-09-22', 'approved'),
  ('Materials', 'Finishing', 5600.75, 'Stains, varnishes, and protective coatings', 'Finish Pro Supply', 'wire_transfer', '2025-09-25', 'approved'),

  -- Labor expenses
  ('Labor', 'Manufacturing', 45000.00, 'Production staff salaries - September', 'Payroll', 'wire_transfer', '2025-09-30', 'approved'),
  ('Labor', 'Design', 22000.00, 'Design team salaries - September', 'Payroll', 'wire_transfer', '2025-09-30', 'approved'),
  ('Labor', 'QC', 12500.00, 'Quality control staff - September', 'Payroll', 'wire_transfer', '2025-09-30', 'approved'),

  -- Shipping expenses
  ('Shipping', 'Freight', 8900.00, 'Container shipping to West Coast', 'Global Freight Co', 'invoice', '2025-09-20', 'approved'),
  ('Shipping', 'Local Delivery', 2300.50, 'Local delivery services', 'Quick Ship Logistics', 'credit_card', '2025-09-28', 'approved'),
  ('Shipping', 'Packaging', 1850.00, 'Protective packaging materials', 'Pack Safe Inc', 'invoice', '2025-09-12', 'approved'),

  -- Overhead expenses
  ('Overhead', 'Rent', 15000.00, 'Factory and office rent - September', 'Property Management LLC', 'wire_transfer', '2025-09-01', 'approved'),
  ('Overhead', 'Utilities', 4200.00, 'Electricity, water, gas - September', 'City Utilities', 'auto_debit', '2025-09-05', 'approved'),
  ('Overhead', 'Insurance', 3500.00, 'Business liability insurance', 'Insurance Co', 'wire_transfer', '2025-09-10', 'approved'),
  ('Overhead', 'Software', 2400.00, 'SaaS subscriptions and licenses', 'Various Vendors', 'credit_card', '2025-09-01', 'approved'),

  -- Marketing expenses
  ('Marketing', 'Advertising', 6500.00, 'Online advertising campaigns', 'Digital Ads Agency', 'credit_card', '2025-09-15', 'approved'),
  ('Marketing', 'Trade Shows', 4800.00, 'Furniture expo booth rental', 'Expo Center', 'wire_transfer', '2025-09-08', 'approved'),
  ('Marketing', 'Content', 2200.00, 'Photography and videography', 'Creative Media Co', 'invoice', '2025-09-20', 'approved'),

  -- Equipment expenses
  ('Equipment', 'Machinery', 18000.00, 'CNC router maintenance and upgrades', 'Industrial Equipment Co', 'wire_transfer', '2025-09-12', 'approved'),
  ('Equipment', 'Tools', 3400.00, 'Hand tools and power tools', 'Tool Supply Warehouse', 'credit_card', '2025-09-18', 'approved'),
  ('Equipment', 'Safety', 1600.00, 'Safety equipment and PPE', 'Safety First Supply', 'invoice', '2025-09-05', 'approved'),

  -- Office expenses
  ('Office', 'Supplies', 850.00, 'Office supplies and stationery', 'Office Depot', 'credit_card', '2025-09-10', 'approved'),
  ('Office', 'Furniture', 2400.00, 'Ergonomic office chairs', 'Office Solutions', 'invoice', '2025-09-15', 'approved'),
  ('Office', 'IT Equipment', 4200.00, 'Laptops and monitors', 'Tech Store', 'credit_card', '2025-09-22', 'approved'),

  -- Professional Services
  ('Professional Services', 'Legal', 5000.00, 'Contract review and legal consultation', 'Law Firm LLP', 'wire_transfer', '2025-09-25', 'approved'),
  ('Professional Services', 'Accounting', 3500.00, 'Monthly accounting and bookkeeping', 'Accounting Services Inc', 'invoice', '2025-09-30', 'approved'),

  -- Pending approvals (recent expenses)
  ('Materials', 'Metal', 7200.00, 'Stainless steel components', 'Metal Works Inc', 'invoice', '2025-10-02', 'pending'),
  ('Shipping', 'Express', 3800.00, 'Rush delivery for priority orders', 'Express Shipping Co', 'credit_card', '2025-10-03', 'pending'),
  ('Marketing', 'SEO', 2500.00, 'SEO services - October', 'Digital Marketing Agency', 'invoice', '2025-10-01', 'pending'),
  ('Equipment', 'Maintenance', 1900.00, 'Regular equipment servicing', 'Maintenance Co', 'invoice', '2025-10-04', 'pending'),
  ('Office', 'Cleaning', 800.00, 'Office cleaning services', 'Clean Pro Services', 'auto_debit', '2025-10-01', 'pending')
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE expenses IS 'Tracks all business expenses for financial management and reporting';
COMMENT ON COLUMN expenses.category IS 'Main expense category (Materials, Labor, Shipping, etc.)';
COMMENT ON COLUMN expenses.subcategory IS 'Detailed sub-category within main category';
COMMENT ON COLUMN expenses.amount IS 'Expense amount in dollars';
COMMENT ON COLUMN expenses.approval_status IS 'Approval status: pending, approved, rejected';
