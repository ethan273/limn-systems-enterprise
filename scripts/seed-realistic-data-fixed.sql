-- =====================================================
-- REALISTIC TEST DATA SEEDING SCRIPT (CORRECTED)
-- =====================================================
-- Purpose: Populate database with realistic test data for comprehensive testing
-- Tables: customers, products, orders, contacts
-- Run with: psql connection or via Supabase SQL editor
-- Schema-corrected version matching actual database structure

-- =====================================================
-- CUSTOMERS - Realistic company names and details
-- =====================================================
INSERT INTO customers (name, email, phone, company, type, status, notes, created_at)
VALUES
  ('Acme Corporation', 'orders@acmecorp.com', '555-0100', 'Acme Corporation', 'business', 'active', 'Long-term enterprise client since 2020', NOW() - INTERVAL '2 years'),
  ('TechStart Industries', 'procurement@techstart.io', '555-0101', 'TechStart Industries', 'business', 'active', 'Fast-growing tech startup', NOW() - INTERVAL '1 year'),
  ('Global Furniture Solutions', 'purchasing@globalfurniture.com', '555-0102', 'Global Furniture Solutions', 'business', 'active', 'Major distributor for Midwest region', NOW() - INTERVAL '3 years'),
  ('Modern Office Designs', 'info@modernoffice.com', '555-0103', 'Modern Office Designs', 'designer', 'active', 'High-end office furniture designer', NOW() - INTERVAL '18 months'),
  ('Hospitality Interiors Inc', 'orders@hospitalityinteriors.com', '555-0104', 'Hospitality Interiors Inc', 'business', 'active', 'Specializes in hotel furniture', NOW() - INTERVAL '2 years'),
  ('University Furnishings', 'procurement@universityfurnish.edu', '555-0105', 'University Furnishings', 'business', 'active', 'Educational institution bulk buyer', NOW() - INTERVAL '5 years'),
  ('Healthcare Seating Co', 'purchasing@healthcareseating.com', '555-0106', 'Healthcare Seating Co', 'business', 'active', 'Specialized healthcare furniture', NOW() - INTERVAL '1 year'),
  ('Retail Store Fixtures LLC', 'orders@retailfixtures.com', '555-0107', 'Retail Store Fixtures LLC', 'business', 'active', 'Retail display furniture', NOW() - INTERVAL '2 years'),
  ('Co-Working Spaces Group', 'admin@coworkingspaces.com', '555-0108', 'Co-Working Spaces Group', 'business', 'active', 'Operates 50+ co-working locations', NOW() - INTERVAL '6 months'),
  ('Executive Office Partners', 'contact@executiveoffice.com', '555-0109', 'Executive Office Partners', 'business', 'active', 'Premium executive furniture', NOW() - INTERVAL '3 years'),
  ('Green Building Interiors', 'sustainability@greenbuilding.com', '555-0110', 'Green Building Interiors', 'business', 'active', 'Eco-friendly furniture focus', NOW() - INTERVAL '1 year'),
  ('Luxury Hotel Group', 'procurement@luxuryhotelgroup.com', '555-0111', 'Luxury Hotel Group', 'business', 'active', '5-star hotel chain', NOW() - INTERVAL '4 years'),
  ('Budget Office Supply', 'wholesale@budgetoffice.com', '555-0112', 'Budget Office Supply', 'business', 'active', 'Budget-conscious bulk buyer', NOW() - INTERVAL '18 months'),
  ('Creative Workspace Design', 'hello@creativeworkspace.com', '555-0113', 'Creative Workspace Design', 'designer', 'active', 'Innovative workspace designs', NOW() - INTERVAL '9 months'),
  ('Corporate Campus Furnish', 'facilities@corporatecampus.com', '555-0114', 'Corporate Campus Furnish', 'business', 'active', 'Large corporate campus orders', NOW() - INTERVAL '2 years')
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- CONTACTS - Realistic contact persons for customers
-- =====================================================
INSERT INTO contacts (name, email, phone, company, position, notes, created_at)
VALUES
  ('Sarah Johnson', 'sarah.johnson@acmecorp.com', '555-0200', 'Acme Corporation', 'Chief Procurement Officer', 'Decision maker for all furniture purchases', NOW() - INTERVAL '2 years'),
  ('Michael Chen', 'michael.chen@techstart.io', '555-0201', 'TechStart Industries', 'Office Manager', 'Handles day-to-day office needs', NOW() - INTERVAL '1 year'),
  ('Emily Rodriguez', 'emily.r@globalfurniture.com', '555-0202', 'Global Furniture Solutions', 'VP of Purchasing', 'Bulk order coordinator', NOW() - INTERVAL '3 years'),
  ('David Kim', 'david.kim@modernoffice.com', '555-0203', 'Modern Office Designs', 'Lead Designer', 'Custom project specifications', NOW() - INTERVAL '18 months'),
  ('Jennifer Martinez', 'jennifer.m@hospitalityinteriors.com', '555-0204', 'Hospitality Interiors Inc', 'Project Manager', 'Hotel renovation projects', NOW() - INTERVAL '2 years'),
  ('Robert Taylor', 'robert.taylor@universityfurnish.edu', '555-0205', 'University Furnishings', 'Facilities Director', 'Campus-wide furniture upgrades', NOW() - INTERVAL '5 years'),
  ('Amanda White', 'amanda.white@healthcareseating.com', '555-0206', 'Healthcare Seating Co', 'Procurement Specialist', 'Medical-grade furniture only', NOW() - INTERVAL '1 year'),
  ('Christopher Lee', 'chris.lee@retailfixtures.com', '555-0207', 'Retail Store Fixtures LLC', 'Buyer', 'Retail display needs', NOW() - INTERVAL '2 years'),
  ('Jessica Brown', 'jessica.b@coworkingspaces.com', '555-0208', 'Co-Working Spaces Group', 'COO', 'Multi-location buyer', NOW() - INTERVAL '6 months'),
  ('Daniel Anderson', 'daniel.a@executiveoffice.com', '555-0209', 'Executive Office Partners', 'Senior Buyer', 'Premium furniture specialist', NOW() - INTERVAL '3 years'),
  ('Lauren Green', 'lauren.green@greenbuilding.com', '555-0210', 'Green Building Interiors', 'Sustainability Director', 'Eco-certified products only', NOW() - INTERVAL '1 year'),
  ('Thomas Wilson', 'thomas.w@luxuryhotelgroup.com', '555-0211', 'Luxury Hotel Group', 'VP of Design', 'High-end hotel projects', NOW() - INTERVAL '4 years'),
  ('Michelle Davis', 'michelle.d@budgetoffice.com', '555-0212', 'Budget Office Supply', 'Wholesale Manager', 'Cost-effective solutions', NOW() - INTERVAL '18 months'),
  ('Kevin Martinez', 'kevin.m@creativeworkspace.com', '555-0213', 'Creative Workspace Design', 'Founder', 'Unique design requests', NOW() - INTERVAL '9 months'),
  ('Rachel Thompson', 'rachel.t@corporatecampus.com', '555-0214', 'Corporate Campus Furnish', 'Facilities Manager', 'Campus-wide projects', NOW() - INTERVAL '2 years')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PRODUCTS - Realistic furniture products with proper details
-- =====================================================
INSERT INTO products (name, sku, description, category, base_price, weight_lbs, dimensions, unit, created_at)
VALUES
  ('Executive Leather Chair - Black', 'EXC-001-BLK', 'Premium leather executive chair with lumbar support and adjustable armrests', 'Seating', 899.99, 45.5, '28"W x 30"D x 46"H', 'each', NOW() - INTERVAL '3 years'),
  ('Ergonomic Task Chair - Gray', 'TSK-002-GRY', 'Breathable mesh back task chair with ergonomic design', 'Seating', 349.99, 32.0, '26"W x 26"D x 40"H', 'each', NOW() - INTERVAL '2 years'),
  ('Standing Desk - Adjustable', 'DSK-003-ADJ', 'Electric height-adjustable standing desk, 60"x30"', 'Desks', 799.99, 120.0, '60"W x 30"D x 48"H', 'each', NOW() - INTERVAL '18 months'),
  ('Conference Table - 8ft', 'CNF-004-8FT', 'Solid wood conference table seats 8-10 people', 'Tables', 1299.99, 180.0, '96"W x 48"D x 30"H', 'each', NOW() - INTERVAL '2 years'),
  ('Modular Sofa Section - Navy', 'SOF-005-NAV', 'Modular sofa section with removable cushions', 'Seating', 599.99, 85.0, '36"W x 36"D x 32"H', 'each', NOW() - INTERVAL '1 year'),
  ('Bookshelf - 6ft Tall', 'SHF-006-6FT', 'Solid oak bookshelf with 5 adjustable shelves', 'Storage', 449.99, 95.0, '36"W x 12"D x 72"H', 'each', NOW() - INTERVAL '3 years'),
  ('Reception Desk - Modern', 'RCP-007-MOD', 'Modern reception desk with LED lighting', 'Desks', 1499.99, 200.0, '72"W x 30"D x 42"H', 'each', NOW() - INTERVAL '1 year'),
  ('Lounge Chair - Mid-Century', 'LNG-008-MCM', 'Mid-century modern lounge chair with ottoman', 'Seating', 729.99, 55.0, '32"W x 34"D x 30"H', 'each', NOW() - INTERVAL '2 years'),
  ('Filing Cabinet - 4 Drawer', 'FIL-009-4DR', 'Locking 4-drawer filing cabinet, letter size', 'Storage', 299.99, 110.0, '15"W x 28"D x 52"H', 'each', NOW() - INTERVAL '4 years'),
  ('Cafe Table - Round 36"', 'CAF-010-RND', 'Round cafe table with metal base, 36" diameter', 'Tables', 249.99, 45.0, '36" diameter x 30"H', 'each', NOW() - INTERVAL '18 months'),
  ('Training Room Chair - Stack', 'TRN-011-STK', 'Stackable training room chair with tablet arm', 'Seating', 179.99, 18.0, '20"W x 22"D x 32"H', 'each', NOW() - INTERVAL '2 years'),
  ('L-Shaped Desk - Executive', 'DSK-012-LSH', 'Executive L-shaped desk with hutch, 72"x72"', 'Desks', 1599.99, 250.0, '72"W x 72"D x 30"H', 'each', NOW() - INTERVAL '3 years'),
  ('Benching System - 6 Person', 'BNC-013-6PR', 'Open benching system for 6 people with dividers', 'Desks', 2999.99, 480.0, '144"W x 60"D x 30"H', 'each', NOW() - INTERVAL '1 year'),
  ('Guest Chair - Upholstered', 'GST-014-UPH', 'Upholstered guest chair with wooden arms', 'Seating', 299.99, 28.0, '24"W x 26"D x 34"H', 'each', NOW() - INTERVAL '2 years'),
  ('Storage Cabinet - Tall', 'CAB-015-TLL', 'Tall storage cabinet with locking doors, 72"H', 'Storage', 549.99, 130.0, '36"W x 18"D x 72"H', 'each', NOW() - INTERVAL '18 months')
ON CONFLICT (sku) DO NOTHING;

-- =====================================================
-- ORDERS - Realistic order data with varied statuses and dates
-- =====================================================
-- Note: This requires matching customer IDs from the customers table
-- We'll use subqueries to get actual customer IDs

DO $$
DECLARE
  v_customer_id UUID;
  v_order_id UUID;
BEGIN
  -- Order 1: Acme Corporation - Large executive furniture order
  SELECT id INTO v_customer_id FROM customers WHERE email = 'orders@acmecorp.com' LIMIT 1;
  IF v_customer_id IS NOT NULL THEN
    INSERT INTO orders (customer_id, order_number, status, total_amount, notes, created_at, due_date)
    VALUES (v_customer_id, 'ORD-2024-001', 'completed', 15499.85, 'Executive suite furniture for new office', NOW() - INTERVAL '45 days', NOW() - INTERVAL '30 days')
    ON CONFLICT (order_number) DO NOTHING
    RETURNING id INTO v_order_id;
  END IF;

  -- Order 2: TechStart Industries - Startup office setup
  SELECT id INTO v_customer_id FROM customers WHERE email = 'procurement@techstart.io' LIMIT 1;
  IF v_customer_id IS NOT NULL THEN
    INSERT INTO orders (customer_id, order_number, status, total_amount, notes, created_at, due_date)
    VALUES (v_customer_id, 'ORD-2024-002', 'in_progress', 8750.50, '25 workstations for new hires', NOW() - INTERVAL '15 days', NOW() + INTERVAL '3 days')
    ON CONFLICT (order_number) DO NOTHING
    RETURNING id INTO v_order_id;
  END IF;

  -- Order 3: Global Furniture Solutions - Bulk distribution order
  SELECT id INTO v_customer_id FROM customers WHERE email = 'purchasing@globalfurniture.com' LIMIT 1;
  IF v_customer_id IS NOT NULL THEN
    INSERT INTO orders (customer_id, order_number, status, total_amount, notes, created_at, due_date)
    VALUES (v_customer_id, 'ORD-2024-003', 'pending', 45200.00, 'Quarterly bulk inventory replenishment', NOW() - INTERVAL '10 days', NOW() + INTERVAL '20 days')
    ON CONFLICT (order_number) DO NOTHING
    RETURNING id INTO v_order_id;
  END IF;

  -- Order 4: Modern Office Designs - Custom design project
  SELECT id INTO v_customer_id FROM customers WHERE email = 'info@modernoffice.com' LIMIT 1;
  IF v_customer_id IS NOT NULL THEN
    INSERT INTO orders (customer_id, order_number, status, total_amount, notes, created_at, due_date)
    VALUES (v_customer_id, 'ORD-2024-004', 'pending', 22350.75, 'Custom office suite with special finishes', NOW() - INTERVAL '5 days', NOW() + INTERVAL '40 days')
    ON CONFLICT (order_number) DO NOTHING
    RETURNING id INTO v_order_id;
  END IF;

  -- Order 5: Hospitality Interiors - Hotel renovation
  SELECT id INTO v_customer_id FROM customers WHERE email = 'orders@hospitalityinteriors.com' LIMIT 1;
  IF v_customer_id IS NOT NULL THEN
    INSERT INTO orders (customer_id, order_number, status, total_amount, notes, created_at, due_date)
    VALUES (v_customer_id, 'ORD-2024-005', 'completed', 68900.00, 'Boutique hotel lobby and guest room furniture', NOW() - INTERVAL '60 days', NOW() - INTERVAL '45 days')
    ON CONFLICT (order_number) DO NOTHING
    RETURNING id INTO v_order_id;
  END IF;

  -- Order 6: University Furnishings - Campus library
  SELECT id INTO v_customer_id FROM customers WHERE email = 'procurement@universityfurnish.edu' LIMIT 1;
  IF v_customer_id IS NOT NULL THEN
    INSERT INTO orders (customer_id, order_number, status, total_amount, notes, created_at, due_date)
    VALUES (v_customer_id, 'ORD-2024-006', 'in_progress', 34500.00, 'Library study furniture and carrels', NOW() - INTERVAL '20 days', NOW() + INTERVAL '5 days')
    ON CONFLICT (order_number) DO NOTHING
    RETURNING id INTO v_order_id;
  END IF;

  -- Order 7: Healthcare Seating - Medical facility
  SELECT id INTO v_customer_id FROM customers WHERE email = 'purchasing@healthcareseating.com' LIMIT 1;
  IF v_customer_id IS NOT NULL THEN
    INSERT INTO orders (customer_id, order_number, status, total_amount, notes, created_at, due_date)
    VALUES (v_customer_id, 'ORD-2024-007', 'pending', 18750.50, 'Waiting room seating - antimicrobial fabric', NOW() - INTERVAL '12 days', NOW() + INTERVAL '18 days')
    ON CONFLICT (order_number) DO NOTHING
    RETURNING id INTO v_order_id;
  END IF;

  -- Order 8: Co-Working Spaces - Multi-location rollout
  SELECT id INTO v_customer_id FROM customers WHERE email = 'admin@coworkingspaces.com' LIMIT 1;
  IF v_customer_id IS NOT NULL THEN
    INSERT INTO orders (customer_id, order_number, status, total_amount, notes, created_at, due_date)
    VALUES (v_customer_id, 'ORD-2024-008', 'pending', 95000.00, '5 new location furniture packages', NOW() - INTERVAL '3 days', NOW() + INTERVAL '35 days')
    ON CONFLICT (order_number) DO NOTHING
    RETURNING id INTO v_order_id;
  END IF;

  -- Order 9: Budget Office Supply - Wholesale bulk
  SELECT id INTO v_customer_id FROM customers WHERE email = 'wholesale@budgetoffice.com' LIMIT 1;
  IF v_customer_id IS NOT NULL THEN
    INSERT INTO orders (customer_id, order_number, status, total_amount, notes, created_at, due_date)
    VALUES (v_customer_id, 'ORD-2024-009', 'completed', 42300.00, 'Warehouse stock replenishment - mixed items', NOW() - INTERVAL '50 days', NOW() - INTERVAL '35 days')
    ON CONFLICT (order_number) DO NOTHING
    RETURNING id INTO v_order_id;
  END IF;

  -- Order 10: Luxury Hotel Group - Premium suite furnishings
  SELECT id INTO v_customer_id FROM customers WHERE email = 'procurement@luxuryhotelgroup.com' LIMIT 1;
  IF v_customer_id IS NOT NULL THEN
    INSERT INTO orders (customer_id, order_number, status, total_amount, notes, created_at, due_date)
    VALUES (v_customer_id, 'ORD-2024-010', 'in_progress', 125000.00, 'Presidential suite custom furniture', NOW() - INTERVAL '25 days', NOW() + INTERVAL '7 days')
    ON CONFLICT (order_number) DO NOTHING
    RETURNING id INTO v_order_id;
  END IF;
END $$;

-- =====================================================
-- SUMMARY
-- =====================================================
-- This script adds:
-- - 15 realistic customers with varied company types
-- - 15 realistic contacts with proper titles and positions
-- - 15 realistic furniture products with pricing and inventory
-- - 10 realistic orders with varied statuses and amounts
--
-- Total value: ~$476,000 in orders
-- Date range: Last 60 days to 40 days future
-- Status mix: pending, in_progress, completed
-- =====================================================
