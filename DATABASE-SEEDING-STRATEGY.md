# Comprehensive Database Seeding Strategy

**Version**: 1.0.0
**Last Updated**: 2025-10-04
**Purpose**: Repeatable seeding process for all modules with realistic test data

---

## 🎯 SEEDING PHILOSOPHY

### Core Principles
1. **Realistic Data** - Use real-world patterns, not "test123" values
2. **Complete Workflows** - Seed entire business processes, not isolated records
3. **Varied Statuses** - Include all status variations (pending, active, completed, etc.)
4. **Foreign Key Integrity** - Seed parent tables before child tables
5. **Repeatability** - Scripts should be idempotent and re-runnable
6. **Performance** - Direct SQL for speed, Prisma for type safety

---

## 📊 SEEDING ORDER (Foreign Key Hierarchy)

**CRITICAL: Seed tables in this exact order to maintain referential integrity:**

```
1. FOUNDATION (No dependencies)
   ├── user_profiles
   ├── user_roles
   ├── collections
   └── items (products)

2. CRM (Depends on user_profiles)
   ├── contacts
   ├── leads (FK: contact_id)
   ├── customers (FK: contact_id, lead_id)
   └── projects (FK: customer_id)

3. PARTNERS (No dependencies)
   ├── partners (designers, factories, contractors)
   └── partner_relationships

4. TASKS (Depends on projects, user_profiles)
   └── tasks (FK: project_id, assigned_to)

5. DESIGN (Depends on projects, partners)
   ├── design_projects (FK: project_id)
   ├── design_briefs (FK: design_project_id, designer_id)
   ├── mood_boards (FK: design_project_id)
   └── design_documents (FK: design_project_id)

6. ORDERS (Depends on customers, projects, items)
   ├── orders (FK: customer_id, project_id)
   └── order_items (FK: order_id, item_id)

7. PRODUCTION (Depends on orders, order_items)
   ├── production_orders (FK: order_id, item_id)
   ├── shop_drawings (FK: production_order_id)
   └── qc_inspections (FK: order_id, order_item_id)

8. SHIPPING (Depends on orders)
   └── shipments (FK: order_id)

9. FINANCIAL (Depends on customers, orders)
   ├── invoices (FK: customer_id, order_id)
   ├── invoice_items (FK: invoice_id, item_id)
   └── payments (FK: invoice_id)
```

---

## 🗂️ MODULE-BY-MODULE SEEDING GUIDE

### 1. USER MANAGEMENT

**Tables**: `user_profiles`, `user_roles`

**Data Volume**:
- 10 user profiles (Sales, Production, Design, Admin roles)
- 10 user role assignments

**Script Location**: `/scripts/seed/01-users.sql`

**Sample Data Pattern**:
```sql
-- Users with varied roles and departments
INSERT INTO user_profiles (id, email, name, department, role, status)
VALUES
  (gen_random_uuid(), 'john.sales@limn.com', 'John Smith', 'sales', 'account_manager', 'active'),
  (gen_random_uuid(), 'jane.production@limn.com', 'Jane Doe', 'production', 'production_manager', 'active'),
  (gen_random_uuid(), 'mike.design@limn.com', 'Mike Chen', 'design', 'senior_designer', 'active');
```

---

### 2. PRODUCT CATALOG

**Tables**: `collections`, `items`

**Data Volume**:
- 5 collections (UKIAH, INYO, RAGUSA, PACIFICA, CUSTOM)
- 60 items (Production Ready products)

**Script Location**: `/scripts/seed/02-products.sql`

**Sample Data Pattern**:
```sql
-- Collections
INSERT INTO collections (id, name, description, status)
VALUES
  (gen_random_uuid(), 'UKIAH', 'Modern minimalist collection', 'active'),
  (gen_random_uuid(), 'INYO', 'Industrial contemporary collection', 'active');

-- Items with realistic dimensions and pricing
INSERT INTO items (id, name, collection_id, category, price, status, weight_lbs, height_inches, width_inches, depth_inches)
VALUES
  (gen_random_uuid(), 'Ukiah Dining Table 84"', (SELECT id FROM collections WHERE name='UKIAH'), 'tables', 2450.00, 'production_ready', 125, 30, 84, 42);
```

---

### 3. CRM MODULE

**Tables**: `contacts`, `leads`, `customers`, `projects`

**Data Volume**:
- 50 contacts
- 50 leads (varied prospect statuses: hot, warm, cold)
- 30 customers (converted from leads)
- 30 projects (linked to customers)

**Script Location**: `/scripts/seed/03-crm.sql`

**Sample Data Pattern**:
```sql
-- Contacts with realistic business information
INSERT INTO contacts (id, name, email, phone, company, job_title, created_at)
VALUES
  (gen_random_uuid(), 'Sarah Johnson', 'sarah.j@acmecorp.com', '555-0101', 'Acme Corporation', 'VP Operations', NOW() - INTERVAL '45 days'),
  (gen_random_uuid(), 'David Lee', 'dlee@techstartup.io', '555-0102', 'TechStartup Inc', 'Founder & CEO', NOW() - INTERVAL '30 days');

-- Leads with varied statuses and lead values
INSERT INTO leads (id, contact_id, status, prospect_status, lead_value, source, created_at)
VALUES
  (gen_random_uuid(), (SELECT id FROM contacts WHERE email='sarah.j@acmecorp.com'), 'won', 'hot', 125000, 'referral', NOW() - INTERVAL '40 days'),
  (gen_random_uuid(), (SELECT id FROM contacts WHERE email='dlee@techstartup.io'), 'qualified', 'warm', 85000, 'website', NOW() - INTERVAL '25 days');

-- Customers (converted leads)
INSERT INTO customers (id, contact_id, lead_id, name, email, type, status, created_at)
VALUES
  (gen_random_uuid(),
   (SELECT id FROM contacts WHERE email='sarah.j@acmecorp.com'),
   (SELECT id FROM leads WHERE contact_id=(SELECT id FROM contacts WHERE email='sarah.j@acmecorp.com')),
   'Acme Corporation', 'sarah.j@acmecorp.com', 'business', 'active', NOW() - INTERVAL '35 days');

-- Projects with budgets
INSERT INTO projects (id, customer_id, name, status, budget, priority, start_date, created_at)
VALUES
  (gen_random_uuid(),
   (SELECT id FROM customers WHERE name='Acme Corporation'),
   'Acme HQ Office Renovation', 'in_progress', 125000, 'high', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days');
```

**Status Distributions**:
- Leads: 40% won, 30% qualified, 20% contacted, 10% new
- Prospect Status: 30% hot, 40% warm, 30% cold
- Customers: 80% active, 15% inactive, 5% pending
- Projects: 60% in_progress, 25% planning, 10% completed, 5% on_hold

---

### 4. PARTNERS MODULE

**Tables**: `partners`

**Data Volume**:
- 20 designers
- 20 factories
- 10 contractors

**Script Location**: `/scripts/seed/04-partners.sql`

**Sample Data Pattern**:
```sql
-- Designers with specializations
INSERT INTO partners (id, name, type, status, specialization, portfolio_url, email, phone, country)
VALUES
  (gen_random_uuid(), 'Studio Minimalist', 'designer', 'active', 'Modern, Minimalist, Residential', 'https://studiominimalist.com', 'contact@studiominimalist.com', '555-0201', 'USA'),
  (gen_random_uuid(), 'Industrial Concepts LLC', 'designer', 'active', 'Industrial, Commercial, Hospitality', 'https://industrialconcepts.design', 'hello@industrialconcepts.design', '555-0202', 'USA');

-- Factories with quality ratings
INSERT INTO partners (id, name, type, status, country, specialization, quality_rating, capacity, lead_time_days, contact_name, email, phone)
VALUES
  (gen_random_uuid(), 'Shanghai Furniture Co.', 'factory', 'active', 'China', 'Chairs, Tables', 4.8, 5000, 45, 'Wei Zhang', 'wei@shanghai-furniture.com', '+86-21-1234-5678'),
  (gen_random_uuid(), 'Vietnam Wood Works', 'factory', 'active', 'Vietnam', 'Custom Wood Furniture', 4.6, 3000, 35, 'Nguyen Tran', 'nguyen@vietnamwood.com', '+84-28-9876-5432');
```

---

### 5. TASKS MODULE

**Tables**: `tasks`

**Data Volume**:
- 100 tasks (linked to projects and users)

**Script Location**: `/scripts/seed/05-tasks.sql`

**Sample Data Pattern**:
```sql
-- Tasks with varied statuses and priorities
INSERT INTO tasks (id, title, description, status, priority, department, project_id, assigned_to, due_date, created_at)
VALUES
  (gen_random_uuid(), 'Follow up with Acme Corp procurement', 'Discuss final pricing and delivery timeline', 'completed', 'high', 'sales',
   (SELECT id FROM projects WHERE name='Acme HQ Office Renovation'),
   (SELECT id FROM user_profiles WHERE email='john.sales@limn.com'),
   NOW() + INTERVAL '3 days', NOW() - INTERVAL '5 days'),

  (gen_random_uuid(), 'Review shop drawings for Project Alpha', 'QC review of manufacturing blueprints', 'in_progress', 'high', 'production',
   (SELECT id FROM projects LIMIT 1 OFFSET 2),
   (SELECT id FROM user_profiles WHERE email='jane.production@limn.com'),
   NOW() + INTERVAL '2 days', NOW() - INTERVAL '1 day');
```

**Status Distribution**:
- 40% completed
- 35% in_progress
- 20% todo
- 5% cancelled

---

### 6. DESIGN MODULE

**Tables**: `design_projects`, `design_briefs`, `mood_boards`, `design_documents`

**Data Volume**:
- 30 design projects
- 30 design briefs
- 50 mood boards
- 100 design documents

**Script Location**: `/scripts/seed/06-design.sql`

**Sample Data Pattern**:
```sql
-- Design projects
INSERT INTO design_projects (id, project_id, designer_id, status, design_style, budget, start_date, created_at)
VALUES
  (gen_random_uuid(),
   (SELECT id FROM projects WHERE name='Acme HQ Office Renovation'),
   (SELECT id FROM partners WHERE name='Studio Minimalist' AND type='designer'),
   'in_progress', 'modern_minimalist', 15000, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days');

-- Design briefs
INSERT INTO design_briefs (id, design_project_id, title, requirements, deliverables, deadline, status, created_at)
VALUES
  (gen_random_uuid(),
   (SELECT id FROM design_projects LIMIT 1),
   'Executive Office Suite Design', 'Modern executive furniture with integrated technology', 'Mood boards, 3D renderings, material samples', NOW() + INTERVAL '14 days', 'approved', NOW() - INTERVAL '18 days');

-- Mood boards
INSERT INTO mood_boards (id, design_project_id, name, description, board_type, status, created_at)
VALUES
  (gen_random_uuid(),
   (SELECT id FROM design_projects LIMIT 1),
   'Executive Suite - Modern Minimalist', 'Clean lines, neutral palette, walnut accents', 'mood', 'approved', NOW() - INTERVAL '15 days');
```

---

### 7. ORDERS & PRODUCTION MODULE

**Tables**: `orders`, `order_items`, `production_orders`, `shop_drawings`, `qc_inspections`

**Data Volume**:
- 30 orders
- 80 order items (2-3 per order)
- 30 production orders
- 30 shop drawings
- 30 QC inspections

**Script Location**: `/scripts/seed/07-orders-production.sql`

**Sample Data Pattern**:
```sql
-- Orders
INSERT INTO orders (id, order_number, customer_id, project_id, status, total_amount, order_date, created_at)
VALUES
  (gen_random_uuid(), 'ORD-2025-001',
   (SELECT id FROM customers WHERE name='Acme Corporation'),
   (SELECT id FROM projects WHERE name='Acme HQ Office Renovation'),
   'in_production', 47850.00, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days');

-- Order items
INSERT INTO order_items (id, order_id, item_id, quantity, unit_price, created_at)
VALUES
  (gen_random_uuid(),
   (SELECT id FROM orders WHERE order_number='ORD-2025-001'),
   (SELECT id FROM items WHERE name='Ukiah Dining Table 84"'),
   2, 2450.00, NOW() - INTERVAL '15 days');

-- Production orders
INSERT INTO production_orders (id, production_number, order_id, catalog_item_id, product_type, item_name, quantity, unit_price, total_cost, status, deposit_paid, final_payment_paid, order_date, created_at)
VALUES
  (gen_random_uuid(), 'PRD-2025-001',
   (SELECT id FROM orders WHERE order_number='ORD-2025-001'),
   (SELECT id FROM items WHERE name='Ukiah Dining Table 84"'),
   'Production Ready', 'Ukiah Dining Table 84"', 2, 2450.00, 4900.00, 'in_production', true, false, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days');

-- Shop drawings
INSERT INTO shop_drawings (id, drawing_number, production_order_id, drawing_name, current_version, status, created_by, created_at)
VALUES
  (gen_random_uuid(), 'SD-001',
   (SELECT id FROM production_orders WHERE production_number='PRD-2025-001'),
   'Ukiah Table Technical Drawing', 1, 'approved',
   (SELECT id FROM user_profiles WHERE email='jane.production@limn.com'),
   NOW() - INTERVAL '12 days');

-- QC inspections
INSERT INTO qc_inspections (id, order_id, order_item_id, qc_stage, result, inspection_date, created_at)
VALUES
  (gen_random_uuid(),
   (SELECT id FROM orders WHERE order_number='ORD-2025-001'),
   (SELECT id FROM order_items WHERE order_id=(SELECT id FROM orders WHERE order_number='ORD-2025-001') LIMIT 1),
   'final_inspection', 'passed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days');
```

---

### 8. SHIPPING MODULE

**Tables**: `shipments`

**Data Volume**:
- 30 shipments

**Script Location**: `/scripts/seed/08-shipping.sql`

**Sample Data Pattern**:
```sql
-- Shipments with carriers and tracking
INSERT INTO shipments (id, shipment_number, order_id, status, carrier, tracking_number, shipped_date, estimated_delivery, package_count, created_at)
VALUES
  (gen_random_uuid(), 'SHP-2025-001',
   (SELECT id FROM orders WHERE order_number='ORD-2025-001'),
   'shipped', 'FedEx', 'A1B2C3D4E5F6', NOW() - INTERVAL '2 days', NOW() + INTERVAL '5 days', 3, NOW() - INTERVAL '2 days');
```

**Status Distribution**:
- 30% delivered
- 30% in_transit
- 25% shipped
- 10% processing
- 5% pending

---

### 9. FINANCIAL MODULE

**Tables**: `invoices`, `invoice_items`, `payments`

**Data Volume**:
- 30 invoices
- 80 invoice items
- 35 payments

**Script Location**: `/scripts/seed/09-financial.sql`

**Sample Data Pattern**:
```sql
-- Invoices
INSERT INTO invoices (id, invoice_number, customer_id, order_id, status, invoice_date, due_date, subtotal, tax_total, total_amount, amount_paid, payment_terms, created_at)
VALUES
  (gen_random_uuid(), 'INV-2025-001',
   (SELECT id FROM customers WHERE name='Acme Corporation'),
   (SELECT id FROM orders WHERE order_number='ORD-2025-001'),
   'paid', NOW() - INTERVAL '10 days', NOW() + INTERVAL '20 days', 47850.00, 3828.00, 51678.00, 51678.00, 'Net 30', NOW() - INTERVAL '10 days');

-- Invoice items
INSERT INTO invoice_items (id, invoice_id, item_id, description, quantity, unit_price, created_at)
VALUES
  (gen_random_uuid(),
   (SELECT id FROM invoices WHERE invoice_number='INV-2025-001'),
   (SELECT id FROM items WHERE name='Ukiah Dining Table 84"'),
   'Ukiah Dining Table 84" - Walnut finish', 2, 2450.00, NOW() - INTERVAL '10 days');

-- Payments
INSERT INTO payments (id, invoice_id, amount, payment_method, payment_date, reference_number, status, created_at)
VALUES
  (gen_random_uuid(),
   (SELECT id FROM invoices WHERE invoice_number='INV-2025-001'),
   5167800, 'credit_card', NOW() - INTERVAL '5 days', 'PAY-2025-001', 'processed', NOW() - INTERVAL '5 days');
```

---

## 🚀 EXECUTION STRATEGY

### Approach 1: Master Seeding Script (RECOMMENDED)

**File**: `/scripts/seed/master-seed.sh`

```bash
#!/bin/bash

# Master database seeding script
# Runs all seeding scripts in correct order

echo "🌱 Starting comprehensive database seeding..."

# Database connection
PGHOST="db.gwqkbjymbarkufwvdmar.supabase.co"
PGDATABASE="postgres"
PGUSER="postgres"
PGPASSWORD="kegquT-vyspi4-javwon"
PGPORT="5432"

export PGPASSWORD

# Run scripts in order
psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -f scripts/seed/01-users.sql
psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -f scripts/seed/02-products.sql
psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -f scripts/seed/03-crm.sql
psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -f scripts/seed/04-partners.sql
psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -f scripts/seed/05-tasks.sql
psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -f scripts/seed/06-design.sql
psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -f scripts/seed/07-orders-production.sql
psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -f scripts/seed/08-shipping.sql
psql -h $PGHOST -U $PGUSER -d $PGDATABASE -p $PGPORT -f scripts/seed/09-financial.sql

echo "✅ Database seeding complete!"
```

**Usage**:
```bash
chmod +x scripts/seed/master-seed.sh
./scripts/seed/master-seed.sh
```

### Approach 2: Modular Seeding

Seed only specific modules as needed:

```bash
# Seed only CRM data
./scripts/seed/03-crm.sql

# Seed only orders/production
./scripts/seed/07-orders-production.sql
```

---

## ✅ VERIFICATION QUERIES

### Check Data Counts
```sql
SELECT
  'Users' as table_name, COUNT(*) as count FROM user_profiles
UNION ALL SELECT 'Contacts', COUNT(*) FROM contacts
UNION ALL SELECT 'Leads', COUNT(*) FROM leads
UNION ALL SELECT 'Customers', COUNT(*) FROM customers
UNION ALL SELECT 'Projects', COUNT(*) FROM projects
UNION ALL SELECT 'Tasks', COUNT(*) FROM tasks
UNION ALL SELECT 'Partners', COUNT(*) FROM partners
UNION ALL SELECT 'Orders', COUNT(*) FROM orders
UNION ALL SELECT 'Order Items', COUNT(*) FROM order_items
UNION ALL SELECT 'Production Orders', COUNT(*) FROM production_orders
UNION ALL SELECT 'Shipments', COUNT(*) FROM shipments
UNION ALL SELECT 'Invoices', COUNT(*) FROM invoices
UNION ALL SELECT 'Payments', COUNT(*) FROM payments;
```

### Verify Foreign Key Integrity
```sql
-- Check for orphaned records
SELECT 'Orphaned Leads' as issue, COUNT(*) as count
FROM leads l
LEFT JOIN contacts c ON l.contact_id = c.id
WHERE c.id IS NULL

UNION ALL

SELECT 'Orphaned Customers', COUNT(*)
FROM customers cu
LEFT JOIN contacts c ON cu.contact_id = c.id
WHERE c.id IS NULL

UNION ALL

SELECT 'Orphaned Order Items', COUNT(*)
FROM order_items oi
LEFT JOIN orders o ON oi.order_id = o.id
WHERE o.id IS NULL;
```

---

## 🔄 RESET & RE-SEED

### Complete Database Reset
```sql
-- ⚠️ WARNING: This deletes ALL data

-- Delete in reverse dependency order
DELETE FROM payments;
DELETE FROM invoice_items;
DELETE FROM invoices;
DELETE FROM shipments;
DELETE FROM qc_inspections;
DELETE FROM shop_drawings;
DELETE FROM production_orders;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM design_documents;
DELETE FROM mood_boards;
DELETE FROM design_briefs;
DELETE FROM design_projects;
DELETE FROM tasks;
DELETE FROM partners;
DELETE FROM projects;
DELETE FROM customers;
DELETE FROM leads;
DELETE FROM contacts;
DELETE FROM items;
DELETE FROM collections;
DELETE FROM user_roles;
DELETE FROM user_profiles;
```

### Re-seed After Reset
```bash
./scripts/seed/master-seed.sh
```

---

## 📝 MAINTENANCE

### Adding New Seed Data

1. **Identify dependencies** - Which tables must exist first?
2. **Create new SQL file** - `scripts/seed/10-new-module.sql`
3. **Add to master script** - Update `master-seed.sh`
4. **Test in isolation** - Run new script alone first
5. **Test with full seed** - Run master script to verify
6. **Update this document** - Add new module section

### Updating Existing Seed Data

1. **Update individual SQL file** - Modify specific script
2. **Reset affected tables** - Delete only affected records
3. **Re-run script** - Test updated seeding
4. **Verify foreign keys** - Ensure no orphaned records
5. **Update documentation** - Document changes

---

## 🎯 BEST PRACTICES

1. **Use realistic data** - Real company names, valid emails, proper phone formats
2. **Vary statuses** - Include all status types (pending, active, completed, etc.)
3. **Respect constraints** - Check schema for required fields and validations
4. **Use sequences** - ORD-2025-001, ORD-2025-002 for easy identification
5. **Date distributions** - Spread created_at across past 90 days for realism
6. **Price realism** - Use market-appropriate pricing ($500-$15,000 for furniture)
7. **Quantity variation** - Mix of small (1-2) and large (5-10) quantities
8. **Status workflows** - Ensure statuses follow logical progressions

---

## 🔧 TROUBLESHOOTING

### Foreign Key Violations
**Issue**: `ERROR: insert or update on table "X" violates foreign key constraint`
**Fix**: Ensure parent table is seeded first. Check seeding order above.

### Duplicate Key Errors
**Issue**: `ERROR: duplicate key value violates unique constraint`
**Fix**: Use `gen_random_uuid()` for IDs, not hardcoded values. Or add `ON CONFLICT DO NOTHING` clause.

### Missing Required Fields
**Issue**: `ERROR: null value in column "X" violates not-null constraint`
**Fix**: Check Prisma schema for required fields. Ensure all required fields have values.

### Type Mismatches
**Issue**: `ERROR: column "X" is of type Y but expression is of type Z`
**Fix**: Check schema for correct data types (TEXT, UUID, INTEGER, NUMERIC, etc.)

---

**Last Updated**: 2025-10-04
**Maintained By**: Development Team
**Questions**: Refer to existing seed scripts in `/scripts/seed/` for examples
