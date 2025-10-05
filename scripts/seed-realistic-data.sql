-- =====================================================
-- REALISTIC TEST DATA SEEDING SCRIPT
-- =====================================================
-- Purpose: Populate database with realistic test data for comprehensive testing
-- Tables: customers, products, orders, contacts, projects
-- Run with: psql connection or via Supabase SQL editor

-- =====================================================
-- CUSTOMERS - Realistic company names and details
-- =====================================================
INSERT INTO customers (name, email, phone, company_type, billing_address, shipping_address, notes, created_at)
VALUES
  ('Acme Corporation', 'orders@acmecorp.com', '555-0100', 'Enterprise', '123 Corporate Blvd, San Francisco, CA 94102', '123 Corporate Blvd, San Francisco, CA 94102', 'Long-term enterprise client since 2020', NOW() - INTERVAL '2 years'),
  ('TechStart Industries', 'procurement@techstart.io', '555-0101', 'Startup', '456 Innovation Way, Austin, TX 78701', '456 Innovation Way, Austin, TX 78701', 'Fast-growing tech startup', NOW() - INTERVAL '1 year'),
  ('Global Furniture Solutions', 'purchasing@globalfurniture.com', '555-0102', 'Distributor', '789 Warehouse Dr, Chicago, IL 60601', '789 Warehouse Dr, Chicago, IL 60601', 'Major distributor for Midwest region', NOW() - INTERVAL '3 years'),
  ('Modern Office Designs', 'info@modernoffice.com', '555-0103', 'B2B', '321 Design Plaza, New York, NY 10001', '321 Design Plaza, New York, NY 10001', 'High-end office furniture designer', NOW() - INTERVAL '18 months'),
  ('Hospitality Interiors Inc', 'orders@hospitalityinteriors.com', '555-0104', 'Hospitality', '654 Hotel Row, Las Vegas, NV 89101', '654 Hotel Row, Las Vegas, NV 89101', 'Specializes in hotel furniture', NOW() - INTERVAL '2 years'),
  ('University Furnishings', 'procurement@universityfurnish.edu', '555-0105', 'Education', '987 Campus Dr, Boston, MA 02101', '987 Campus Dr, Boston, MA 02101', 'Educational institution bulk buyer', NOW() - INTERVAL '5 years'),
  ('Healthcare Seating Co', 'purchasing@healthcareseating.com', '555-0106', 'Healthcare', '246 Medical Center, Seattle, WA 98101', '246 Medical Center, Seattle, WA 98101', 'Specialized healthcare furniture', NOW() - INTERVAL '1 year'),
  ('Retail Store Fixtures LLC', 'orders@retailfixtures.com', '555-0107', 'Retail', '135 Commerce St, Los Angeles, CA 90001', '135 Commerce St, Los Angeles, CA 90001', 'Retail display furniture', NOW() - INTERVAL '2 years'),
  ('Co-Working Spaces Group', 'admin@coworkingspaces.com', '555-0108', 'Real Estate', '468 Startup Hub, Denver, CO 80201', '468 Startup Hub, Denver, CO 80201', 'Operates 50+ co-working locations', NOW() - INTERVAL '6 months'),
  ('Executive Office Partners', 'contact@executiveoffice.com', '555-0109', 'B2B', '579 Executive Plaza, Miami, FL 33101', '579 Executive Plaza, Miami, FL 33101', 'Premium executive furniture', NOW() - INTERVAL '3 years'),
  ('Green Building Interiors', 'sustainability@greenbuilding.com', '555-0110', 'Sustainable', '802 Eco Way, Portland, OR 97201', '802 Eco Way, Portland, OR 97201', 'Eco-friendly furniture focus', NOW() - INTERVAL '1 year'),
  ('Luxury Hotel Group', 'procurement@luxuryhotelgroup.com', '555-0111', 'Hospitality', '913 Grand Ave, Orlando, FL 32801', '913 Grand Ave, Orlando, FL 32801', '5-star hotel chain', NOW() - INTERVAL '4 years'),
  ('Budget Office Supply', 'wholesale@budgetoffice.com', '555-0112', 'Wholesale', '124 Discount Dr, Phoenix, AZ 85001', '124 Discount Dr, Phoenix, AZ 85001', 'Budget-conscious bulk buyer', NOW() - INTERVAL '18 months'),
  ('Creative Workspace Design', 'hello@creativeworkspace.com', '555-0113', 'Design', '235 Artist Ln, San Diego, CA 92101', '235 Artist Ln, San Diego, CA 92101', 'Innovative workspace designs', NOW() - INTERVAL '9 months'),
  ('Corporate Campus Furnish', 'facilities@corporatecampus.com', '555-0114', 'Enterprise', '346 Tech Park, Dallas, TX 75201', '346 Tech Park, Dallas, TX 75201', 'Large corporate campus orders', NOW() - INTERVAL '2 years')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- CONTACTS - Realistic contact persons for customers
-- =====================================================
INSERT INTO contacts (name, email, phone, company, title, department, notes, created_at)
VALUES
  ('Sarah Johnson', 'sarah.johnson@acmecorp.com', '555-0200', 'Acme Corporation', 'Chief Procurement Officer', 'Procurement', 'Decision maker for all furniture purchases', NOW() - INTERVAL '2 years'),
  ('Michael Chen', 'michael.chen@techstart.io', '555-0201', 'TechStart Industries', 'Office Manager', 'Operations', 'Handles day-to-day office needs', NOW() - INTERVAL '1 year'),
  ('Emily Rodriguez', 'emily.r@globalfurniture.com', '555-0202', 'Global Furniture Solutions', 'VP of Purchasing', 'Purchasing', 'Bulk order coordinator', NOW() - INTERVAL '3 years'),
  ('David Kim', 'david.kim@modernoffice.com', '555-0203', 'Modern Office Designs', 'Lead Designer', 'Design', 'Custom project specifications', NOW() - INTERVAL '18 months'),
  ('Jennifer Martinez', 'jennifer.m@hospitalityinteriors.com', '555-0204', 'Hospitality Interiors Inc', 'Project Manager', 'Projects', 'Hotel renovation projects', NOW() - INTERVAL '2 years'),
  ('Robert Taylor', 'robert.taylor@universityfurnish.edu', '555-0205', 'University Furnishings', 'Facilities Director', 'Facilities', 'Campus-wide furniture upgrades', NOW() - INTERVAL '5 years'),
  ('Amanda White', 'amanda.white@healthcareseating.com', '555-0206', 'Healthcare Seating Co', 'Procurement Specialist', 'Procurement', 'Medical-grade furniture only', NOW() - INTERVAL '1 year'),
  ('Christopher Lee', 'chris.lee@retailfixtures.com', '555-0207', 'Retail Store Fixtures LLC', 'Buyer', 'Purchasing', 'Retail display needs', NOW() - INTERVAL '2 years'),
  ('Jessica Brown', 'jessica.b@coworkingspaces.com', '555-0208', 'Co-Working Spaces Group', 'COO', 'Operations', 'Multi-location buyer', NOW() - INTERVAL '6 months'),
  ('Daniel Anderson', 'daniel.a@executiveoffice.com', '555-0209', 'Executive Office Partners', 'Senior Buyer', 'Procurement', 'Premium furniture specialist', NOW() - INTERVAL '3 years'),
  ('Lauren Green', 'lauren.green@greenbuilding.com', '555-0210', 'Green Building Interiors', 'Sustainability Director', 'Sustainability', 'Eco-certified products only', NOW() - INTERVAL '1 year'),
  ('Thomas Wilson', 'thomas.w@luxuryhotelgroup.com', '555-0211', 'Luxury Hotel Group', 'VP of Design', 'Design', 'High-end hotel projects', NOW() - INTERVAL '4 years'),
  ('Michelle Davis', 'michelle.d@budgetoffice.com', '555-0212', 'Budget Office Supply', 'Wholesale Manager', 'Sales', 'Cost-effective solutions', NOW() - INTERVAL '18 months'),
  ('Kevin Martinez', 'kevin.m@creativeworkspace.com', '555-0213', 'Creative Workspace Design', 'Founder', 'Executive', 'Unique design requests', NOW() - INTERVAL '9 months'),
  ('Rachel Thompson', 'rachel.t@corporatecampus.com', '555-0214', 'Corporate Campus Furnish', 'Facilities Manager', 'Facilities', 'Campus-wide projects', NOW() - INTERVAL '2 years')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PRODUCTS - Realistic furniture products with proper details
-- =====================================================
INSERT INTO products (name, sku, description, category, subcategory, price, cost, stock_quantity, reorder_point, lead_time_days, active, created_at)
VALUES
  ('Executive Leather Chair - Black', 'EXC-001-BLK', 'Premium leather executive chair with lumbar support and adjustable armrests', 'Seating', 'Executive Chairs', 899.99, 450.00, 45, 15, 14, true, NOW() - INTERVAL '3 years'),
  ('Ergonomic Task Chair - Gray', 'TSK-002-GRY', 'Breathable mesh back task chair with ergonomic design', 'Seating', 'Task Chairs', 349.99, 175.00, 120, 30, 7, true, NOW() - INTERVAL '2 years'),
  ('Standing Desk - Adjustable', 'DSK-003-ADJ', 'Electric height-adjustable standing desk, 60"x30"', 'Desks', 'Standing Desks', 799.99, 400.00, 35, 10, 21, true, NOW() - INTERVAL '18 months'),
  ('Conference Table - 8ft', 'CNF-004-8FT', 'Solid wood conference table seats 8-10 people', 'Tables', 'Conference Tables', 1299.99, 650.00, 12, 5, 28, true, NOW() - INTERVAL '2 years'),
  ('Modular Sofa Section - Navy', 'SOF-005-NAV', 'Modular sofa section with removable cushions', 'Seating', 'Sofas', 599.99, 300.00, 28, 8, 14, true, NOW() - INTERVAL '1 year'),
  ('Bookshelf - 6ft Tall', 'SHF-006-6FT', 'Solid oak bookshelf with 5 adjustable shelves', 'Storage', 'Bookcases', 449.99, 225.00, 55, 15, 10, true, NOW() - INTERVAL '3 years'),
  ('Reception Desk - Modern', 'RCP-007-MOD', 'Modern reception desk with LED lighting', 'Desks', 'Reception Desks', 1499.99, 750.00, 8, 3, 35, true, NOW() - INTERVAL '1 year'),
  ('Lounge Chair - Mid-Century', 'LNG-008-MCM', 'Mid-century modern lounge chair with ottoman', 'Seating', 'Lounge Chairs', 729.99, 365.00, 32, 10, 14, true, NOW() - INTERVAL '2 years'),
  ('Filing Cabinet - 4 Drawer', 'FIL-009-4DR', 'Locking 4-drawer filing cabinet, letter size', 'Storage', 'Filing Cabinets', 299.99, 150.00, 75, 20, 7, true, NOW() - INTERVAL '4 years'),
  ('Cafe Table - Round 36"', 'CAF-010-RND', 'Round cafe table with metal base, 36" diameter', 'Tables', 'Cafe Tables', 249.99, 125.00, 90, 25, 10, true, NOW() - INTERVAL '18 months'),
  ('Training Room Chair - Stack', 'TRN-011-STK', 'Stackable training room chair with tablet arm', 'Seating', 'Training Chairs', 179.99, 90.00, 200, 50, 7, true, NOW() - INTERVAL '2 years'),
  ('L-Shaped Desk - Executive', 'DSK-012-LSH', 'Executive L-shaped desk with hutch, 72"x72"', 'Desks', 'Executive Desks', 1599.99, 800.00, 15, 5, 28, true, NOW() - INTERVAL '3 years'),
  ('Benching System - 6 Person', 'BNC-013-6PR', 'Open benching system for 6 people with dividers', 'Desks', 'Benching Systems', 2999.99, 1500.00, 6, 2, 42, true, NOW() - INTERVAL '1 year'),
  ('Guest Chair - Upholstered', 'GST-014-UPH', 'Upholstered guest chair with wooden arms', 'Seating', 'Guest Chairs', 299.99, 150.00, 80, 20, 10, true, NOW() - INTERVAL '2 years'),
  ('Storage Cabinet - Tall', 'CAB-015-TLL', 'Tall storage cabinet with locking doors, 72"H', 'Storage', 'Cabinets', 549.99, 275.00, 40, 12, 14, true, NOW() - INTERVAL '18 months')
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
  SELECT id INTO v_customer_id FROM customers WHERE name = 'Acme Corporation' LIMIT 1;
  IF v_customer_id IS NOT NULL THEN
    INSERT INTO orders (customer_id, order_number, status, order_date, delivery_date, total_amount, notes)
    VALUES (v_customer_id, 'ORD-2024-001', 'delivered', NOW() - INTERVAL '45 days', NOW() - INTERVAL '30 days', 15499.85, 'Executive suite furniture for new office')
    RETURNING id INTO v_order_id;
  END IF;

  -- Order 2: TechStart Industries - Startup office setup
  SELECT id INTO v_customer_id FROM customers WHERE name = 'TechStart Industries' LIMIT 1;
  IF v_customer_id IS NOT NULL THEN
    INSERT INTO orders (customer_id, order_number, status, order_date, delivery_date, total_amount, notes)
    VALUES (v_customer_id, 'ORD-2024-002', 'shipped', NOW() - INTERVAL '15 days', NOW() + INTERVAL '3 days', 8750.50, '25 workstations for new hires')
    RETURNING id INTO v_order_id;
  END IF;

  -- Order 3: Global Furniture Solutions - Bulk distribution order
  SELECT id INTO v_customer_id FROM customers WHERE name = 'Global Furniture Solutions' LIMIT 1;
  IF v_customer_id IS NOT NULL THEN
    INSERT INTO orders (customer_id, order_number, status, order_date, delivery_date, total_amount, notes)
    VALUES (v_customer_id, 'ORD-2024-003', 'processing', NOW() - INTERVAL '10 days', NOW() + INTERVAL '20 days', 45200.00, 'Quarterly bulk inventory replenishment')
    RETURNING id INTO v_order_id;
  END IF;

  -- Order 4: Modern Office Designs - Custom design project
  SELECT id INTO v_customer_id FROM customers WHERE name = 'Modern Office Designs' LIMIT 1;
  IF v_customer_id IS NOT NULL THEN
    INSERT INTO orders (customer_id, order_number, status, order_date, delivery_date, total_amount, notes)
    VALUES (v_customer_id, 'ORD-2024-004', 'pending', NOW() - INTERVAL '5 days', NOW() + INTERVAL '40 days', 22350.75, 'Custom office suite with special finishes')
    RETURNING id INTO v_order_id;
  END IF;

  -- Order 5: Hospitality Interiors - Hotel renovation
  SELECT id INTO v_customer_id FROM customers WHERE name = 'Hospitality Interiors Inc' LIMIT 1;
  IF v_customer_id IS NOT NULL THEN
    INSERT INTO orders (customer_id, order_number, status, order_date, delivery_date, total_amount, notes)
    VALUES (v_customer_id, 'ORD-2024-005', 'delivered', NOW() - INTERVAL '60 days', NOW() - INTERVAL '45 days', 68900.00, 'Boutique hotel lobby and guest room furniture')
    RETURNING id INTO v_order_id;
  END IF;

  -- Order 6: University Furnishings - Campus library
  SELECT id INTO v_customer_id FROM customers WHERE name = 'University Furnishings' LIMIT 1;
  IF v_customer_id IS NOT NULL THEN
    INSERT INTO orders (customer_id, order_number, status, order_date, delivery_date, total_amount, notes)
    VALUES (v_customer_id, 'ORD-2024-006', 'shipped', NOW() - INTERVAL '20 days', NOW() + INTERVAL '5 days', 34500.00, 'Library study furniture and carrels')
    RETURNING id INTO v_order_id;
  END IF;

  -- Order 7: Healthcare Seating - Medical facility
  SELECT id INTO v_customer_id FROM customers WHERE name = 'Healthcare Seating Co' LIMIT 1;
  IF v_customer_id IS NOT NULL THEN
    INSERT INTO orders (customer_id, order_number, status, order_date, delivery_date, total_amount, notes)
    VALUES (v_customer_id, 'ORD-2024-007', 'processing', NOW() - INTERVAL '12 days', NOW() + INTERVAL '18 days', 18750.50, 'Waiting room seating - antimicrobial fabric')
    RETURNING id INTO v_order_id;
  END IF;

  -- Order 8: Co-Working Spaces - Multi-location rollout
  SELECT id INTO v_customer_id FROM customers WHERE name = 'Co-Working Spaces Group' LIMIT 1;
  IF v_customer_id IS NOT NULL THEN
    INSERT INTO orders (customer_id, order_number, status, order_date, delivery_date, total_amount, notes)
    VALUES (v_customer_id, 'ORD-2024-008', 'pending', NOW() - INTERVAL '3 days', NOW() + INTERVAL '35 days', 95000.00, '5 new location furniture packages')
    RETURNING id INTO v_order_id;
  END IF;

  -- Order 9: Budget Office Supply - Wholesale bulk
  SELECT id INTO v_customer_id FROM customers WHERE name = 'Budget Office Supply' LIMIT 1;
  IF v_customer_id IS NOT NULL THEN
    INSERT INTO orders (customer_id, order_number, status, order_date, delivery_date, total_amount, notes)
    VALUES (v_customer_id, 'ORD-2024-009', 'delivered', NOW() - INTERVAL '50 days', NOW() - INTERVAL '35 days', 42300.00, 'Warehouse stock replenishment - mixed items')
    RETURNING id INTO v_order_id;
  END IF;

  -- Order 10: Luxury Hotel Group - Premium suite furnishings
  SELECT id INTO v_customer_id FROM customers WHERE name = 'Luxury Hotel Group' LIMIT 1;
  IF v_customer_id IS NOT NULL THEN
    INSERT INTO orders (customer_id, order_number, status, order_date, delivery_date, total_amount, notes)
    VALUES (v_customer_id, 'ORD-2024-010', 'shipped', NOW() - INTERVAL '25 days', NOW() + INTERVAL '7 days', 125000.00, 'Presidential suite custom furniture')
    RETURNING id INTO v_order_id;
  END IF;
END $$;

-- =====================================================
-- SUMMARY
-- =====================================================
-- This script adds:
-- - 15 realistic customers with varied company types
-- - 15 realistic contacts with proper titles and departments
-- - 15 realistic furniture products with pricing and inventory
-- - 10 realistic orders with varied statuses and amounts
--
-- Total value: ~$490,000 in orders
-- Date range: Last 60 days to 40 days future
-- Status mix: pending, processing, shipped, delivered
-- =====================================================
