# Orders, Production, Shipping & Financial Modules Seeding Plan

**Date**: 2025-10-04
**Goal**: Seed complete Order → Production → Shipping → Invoice → Payment workflows
**Approach**: Extended SQL script building on existing 25 customer journeys

---

## 🎯 OBJECTIVES

Extend the existing 25 customer journeys with:
1. **Orders** - Customer orders with line items from product catalog
2. **Production Orders** - Manufacturing orders linked to customer orders
3. **Shop Drawings** - Technical drawings for production
4. **QC Inspections** - Quality control checkpoints
5. **Shipments** - Shipping records with tracking
6. **Invoices** - Customer invoices with line items
7. **Payments** - Payment records for invoices

---

## 📊 DATA FLOW & RELATIONSHIPS

### Complete Business Workflow:
```
Customer (existing 25)
    ↓
Project (existing 25)
    ↓
Order (NEW - 25 orders)
    ├→ Order Items (NEW - 50-75 line items, 2-3 per order)
    ↓
Production Order (NEW - 25 production orders)
    ├→ Shop Drawings (NEW - 25 drawings)
    ├→ QC Inspections (NEW - 25 inspections)
    ↓
Shipment (NEW - 25 shipments)
    ├→ Shipping Tracking (events)
    ↓
Invoice (NEW - 25 invoices)
    ├→ Invoice Items (NEW - 50-75 line items)
    ↓
Payment (NEW - 25-40 payments)
```

---

## 🗂️ TABLES TO SEED

### 1. Orders Table
**Purpose**: Customer orders linking projects to products

**Required Fields**:
- `id` - UUID (generated)
- `order_number` - VARCHAR (ORD-2025-001, ORD-2025-002, etc.)
- `customer_id` - UUID (FK to customers - use existing 25)
- `project_id` - UUID (FK to projects - use existing 25) [OPTIONAL]
- `status` - VARCHAR (pending, confirmed, in_production, shipped, delivered)
- `total_amount` - NUMERIC (calculated from order_items)
- `order_date` - TIMESTAMP (random past date)
- `created_at` - TIMESTAMP

**Status Distribution**:
- 5 orders: pending
- 8 orders: confirmed
- 7 orders: in_production
- 3 orders: shipped
- 2 orders: delivered

**Data Volume**: 25 orders (one per customer journey)

---

### 2. Order Items Table
**Purpose**: Line items for each order (products from catalog)

**Required Fields**:
- `id` - UUID (generated)
- `order_id` - UUID (FK to orders)
- `item_id` - UUID (FK to items - Production Ready products)
- `quantity` - INTEGER (1-5)
- `unit_price` - NUMERIC (from items.price)
- `total` - NUMERIC (quantity * unit_price)
- `created_at` - TIMESTAMP

**Data Volume**: 50-75 items (2-3 items per order)

**Product Selection**: Randomly select from 60 existing Production Ready products

---

### 3. Production Orders Table
**Purpose**: Manufacturing orders for production

**Required Fields**:
- `id` - UUID (generated)
- `order_number` - VARCHAR (PRD-2025-001, PRD-2025-002, etc.) - CHANGED to `production_number`
- `order_id` - UUID (FK to orders)
- `project_id` - UUID (FK to projects) [OPTIONAL]
- `catalog_item_id` - UUID (FK to items - first product from order)
- `product_type` - TEXT (required - 'Production Ready')
- `item_name` - TEXT (required - product name)
- `item_description` - TEXT (optional)
- `quantity` - INTEGER (required - total quantity from order items)
- `unit_price` - NUMERIC (required - average from order items)
- `total_cost` - NUMERIC (required - total order amount)
- `deposit_paid` - BOOLEAN (default false, set true for in_progress+)
- `final_payment_paid` - BOOLEAN (default false, set true for completed)
- `status` - TEXT (awaiting_deposit, in_production, quality_check, completed, shipped)
- `order_date` - TIMESTAMP (required)
- `estimated_ship_date` - DATE (optional)
- `created_at` - TIMESTAMP (required)

**Status Distribution**:
- 3 orders: awaiting_deposit
- 5 orders: in_production
- 7 orders: quality_check
- 8 orders: completed
- 2 orders: shipped

**Data Volume**: 25 production orders (one per order)

---

### 4. Shop Drawings Table
**Purpose**: Technical drawings for production

**Required Fields**:
- `id` - UUID (generated)
- `drawing_number` - VARCHAR (SD-001, SD-002, etc.)
- `production_order_id` - UUID (FK to production_orders)
- `status` - VARCHAR (draft, submitted, approved, rejected)
- `version` - INTEGER (1)
- `created_at` - TIMESTAMP

**Status Distribution**:
- 2 drawings: draft
- 3 drawings: submitted
- 18 drawings: approved
- 2 drawings: rejected (old versions)

**Data Volume**: 25 shop drawings (one per production order)

---

### 5. QC Inspections Table
**Purpose**: Quality control inspections

**Required Fields**:
- `id` - UUID (generated)
- `production_order_id` - UUID (FK to production_orders)
- `status` - VARCHAR (scheduled, in_progress, passed, failed)
- `inspector_id` - UUID (FK to user_profiles) [OPTIONAL]
- `inspection_date` - TIMESTAMP
- `notes` - TEXT (optional)
- `created_at` - TIMESTAMP

**Status Distribution**:
- 2 inspections: scheduled
- 3 inspections: in_progress
- 18 inspections: passed
- 2 inspections: failed (with notes)

**Data Volume**: 25 QC inspections (one per production order)

---

### 6. Shipments Table
**Purpose**: Shipping records with tracking

**Required Fields**:
- `id` - UUID (generated)
- `shipment_number` - VARCHAR (SHP-2025-001, etc.)
- `order_id` - UUID (FK to orders)
- `status` - TEXT (pending, processing, shipped, in_transit, delivered)
- `carrier` - VARCHAR (FedEx, UPS, DHL, Freight Carrier)
- `tracking_number` - TEXT (random alphanumeric)
- `shipped_date` - TIMESTAMP (for shipped+ statuses)
- `estimated_delivery` - DATE (7-14 days from shipped_date)
- `package_count` - INTEGER (1-5)
- `created_at` - TIMESTAMP

**Status Distribution**:
- 3 shipments: pending
- 4 shipments: processing
- 8 shipments: shipped
- 7 shipments: in_transit
- 3 shipments: delivered

**Carriers Distribution**:
- 40% FedEx
- 30% UPS
- 20% DHL
- 10% Freight Carrier

**Data Volume**: 25 shipments (one per order)

---

### 7. Invoices Table
**Purpose**: Customer invoices

**Required Fields**:
- `id` - UUID (generated)
- `invoice_number` - TEXT (INV-2025-001, etc.)
- `customer_id` - UUID (FK to customers)
- `order_id` - UUID (FK to orders)
- `project_id` - UUID (FK to projects) [OPTIONAL]
- `status` - TEXT (pending, partial, paid, overdue, cancelled)
- `invoice_date` - DATE (order date + 1-3 days)
- `due_date` - DATE (invoice_date + 30 days for Net 30)
- `subtotal` - NUMERIC (order total_amount)
- `tax_total` - NUMERIC (subtotal * 0.08 - 8% tax)
- `total_amount` - NUMERIC (subtotal + tax_total)
- `amount_paid` - NUMERIC (0 for pending, total for paid, partial for partial)
- `payment_terms` - TEXT ('Net 30', 'Net 60', 'Due on Receipt')
- `created_at` - TIMESTAMP

**Status Distribution**:
- 3 invoices: pending
- 4 invoices: partial
- 16 invoices: paid
- 2 invoices: overdue

**Payment Terms Distribution**:
- 60% Net 30
- 30% Net 60
- 10% Due on Receipt

**Data Volume**: 25 invoices (one per order)

---

### 8. Invoice Items Table
**Purpose**: Line items for invoices (mirror order_items)

**Required Fields**:
- `id` - UUID (generated)
- `invoice_id` - UUID (FK to invoices)
- `item_id` - UUID (FK to items) [OPTIONAL]
- `description` - TEXT (product name)
- `quantity` - INTEGER (from order_items)
- `unit_price` - NUMERIC (from order_items)
- `total` - NUMERIC (quantity * unit_price)
- `created_at` - TIMESTAMP

**Data Volume**: 50-75 items (mirror order_items exactly)

---

### 9. Payments Table
**Purpose**: Payment records for invoices

**Required Fields**:
- `id` - UUID (generated)
- `invoice_id` - UUID (FK to invoices)
- `amount` - NUMERIC (full or partial payment)
- `payment_method` - VARCHAR (wire_transfer, credit_card, check, ACH)
- `payment_date` - TIMESTAMP
- `reference_number` - VARCHAR (random alphanumeric)
- `status` - VARCHAR (pending, processed, failed, refunded)
- `created_at` - TIMESTAMP

**Payment Method Distribution**:
- 40% wire_transfer
- 35% credit_card
- 15% check
- 10% ACH

**Data Volume**: 25-40 payments
- 16 invoices (paid) = 16-20 payments (some with multiple partial payments)
- 4 invoices (partial) = 4-8 payments (multiple partials)
- Total: ~25-28 payments

---

## 🛠️ IMPLEMENTATION APPROACH

### Option 1: Extended SQL Script (RECOMMENDED)

**Advantages**:
✅ Fast execution (< 1 minute for all data)
✅ Direct database access
✅ No Prisma schema complexity
✅ Easy to debug and modify
✅ Builds on existing seed-sql.sh script

**Structure**:
```bash
#!/bin/bash
# Extend existing 25 customer journeys with full pipeline

# For each of 25 existing projects:
for PROJECT_ID in $(existing 25 projects); do
  # 1. Create Order for this project
  # 2. Create 2-3 Order Items (random products)
  # 3. Calculate order total
  # 4. Create Production Order
  # 5. Create Shop Drawing
  # 6. Create QC Inspection
  # 7. Create Shipment
  # 8. Create Invoice with items
  # 9. Create Payment(s)
done
```

**Script Location**: `/scripts/seed/seed-orders-production-shipping-financial.sh`

---

### Option 2: TypeScript/Prisma Script

**Advantages**:
✅ Type-safe
✅ Better for complex logic

**Disadvantages**:
❌ Complex Prisma relation syntax
❌ Slower execution
❌ Already tried and had errors

**Decision**: Skip this approach (we tried and had schema issues)

---

## 📋 EXECUTION PLAN

### Step 1: Create Extended SQL Seeding Script

**File**: `/scripts/seed/seed-orders-production-shipping-financial.sh`

**Logic**:
1. Query existing 25 projects → get project_id and customer_id
2. Query existing 60 Production Ready products → get product IDs
3. For each project (loop 25 times):
   - Generate UUIDs for all entities
   - Create Order (link to customer + project)
   - Create 2-3 Order Items (random products)
   - Calculate order total
   - Create Production Order (link to order + first product)
   - Create Shop Drawing (link to production order)
   - Create QC Inspection (link to production order)
   - Create Shipment (link to order)
   - Create Invoice (link to customer + order, mirror order total)
   - Create Invoice Items (mirror order items)
   - Create Payment (link to invoice)

**Estimated Time to Create**: 30-45 minutes
**Estimated Execution Time**: 30-60 seconds

---

### Step 2: Run Seeding Script
```bash
chmod +x /scripts/seed/seed-orders-production-shipping-financial.sh
./scripts/seed/seed-orders-production-shipping-financial.sh
```

---

### Step 3: Verify Data Counts
```sql
SELECT 'Orders' as table, COUNT(*) FROM orders WHERE order_number LIKE 'ORD-2025-%'
UNION ALL
SELECT 'Order Items', COUNT(*) FROM order_items
UNION ALL
SELECT 'Production Orders', COUNT(*) FROM production_orders WHERE order_number LIKE 'PRD-2025-%'
UNION ALL
SELECT 'Shop Drawings', COUNT(*) FROM shop_drawings WHERE drawing_number LIKE 'SD-%'
UNION ALL
SELECT 'QC Inspections', COUNT(*) FROM qc_inspections
UNION ALL
SELECT 'Shipments', COUNT(*) FROM shipments WHERE shipment_number LIKE 'SHP-2025-%'
UNION ALL
SELECT 'Invoices', COUNT(*) FROM invoices WHERE invoice_number LIKE 'INV-2025-%'
UNION ALL
SELECT 'Invoice Items', COUNT(*) FROM invoice_items
UNION ALL
SELECT 'Payments', COUNT(*) FROM payments;
```

---

### Step 4: Visual Testing

**Pages to Test**:
1. **Orders Module**:
   - `/crm/orders` - Verify 25 orders display
   - `/crm/orders/[id]` - Verify order detail with items

2. **Production Module**:
   - `/production/orders` - Verify 25 production orders
   - `/production/shop-drawings` - Verify 25 shop drawings
   - `/production/qc` - Verify 25 QC inspections
   - `/production/ordered-items` - Verify 50-75 items

3. **Shipping Module**:
   - `/shipping` - Verify 25 shipments
   - `/shipping/shipments` - Verify shipment list
   - `/shipping/shipments/[id]` - Verify shipment detail with tracking

4. **Financial Module**:
   - `/financials/invoices` - Verify 25 invoices
   - `/financials/invoices/[id]` - Verify invoice detail with line items
   - `/financials/payments` - Verify 25-28 payments

---

## 🎲 DATA REALISM STRATEGIES

### Realistic Order Numbers:
- Sequential: ORD-2025-001, ORD-2025-002, ..., ORD-2025-025
- Production: PRD-2025-001, PRD-2025-002, ..., PRD-2025-025
- Shipments: SHP-2025-001, SHP-2025-002, ..., SHP-2025-025
- Invoices: INV-2025-001, INV-2025-002, ..., INV-2025-025

### Realistic Pricing:
- Order totals: $5,000 - $150,000 (sum of 2-3 products)
- Products: Use existing product prices ($500 - $15,000)
- Quantities: 1-5 units per line item
- Tax: 8% of subtotal
- Invoice total = Order total + tax

### Realistic Dates:
- Order dates: Past 90 days
- Production order dates: Order date + 1-3 days
- Shipped dates: Production completion + 3-7 days
- Invoice dates: Order date + 1-3 days
- Due dates: Invoice date + 30/60 days
- Payment dates: On time or 0-30 days late

### Realistic Tracking Numbers:
- Format: RANDOM_12_CHAR_ALPHANUMERIC
- Example: A1B2C3D4E5F6, XYZ123ABC789

---

## ✅ SUCCESS METRICS

After seeding, we should have:
- ✅ 25 Orders with realistic order numbers and statuses
- ✅ 50-75 Order Items linking to actual products
- ✅ 25 Production Orders with proper workflow statuses
- ✅ 25 Shop Drawings (mostly approved)
- ✅ 25 QC Inspections (mostly passed)
- ✅ 25 Shipments with carriers and tracking
- ✅ 25 Invoices with proper accounting (subtotal, tax, total)
- ✅ 50-75 Invoice Items (mirror order items)
- ✅ 25-28 Payments with payment methods

### Complete Business Flow Testable:
✅ Contact → Lead → Customer → Project → **Order → Production → Shipment → Invoice → Payment**

---

## 🚀 NEXT STEPS (PENDING YOUR APPROVAL)

1. **Approve this plan** with any modifications
2. **Create extended SQL seeding script** (30-45 min)
3. **Run seeding script** (< 1 min)
4. **Verify data counts** with SQL queries
5. **Test all pages visually** (Orders, Production, Shipping, Financial)
6. **Document results** and any issues found

---

## ❓ QUESTIONS FOR YOUR APPROVAL

1. **Approach**: Approve extended SQL script approach?
2. **Data Volume**: 25 complete journeys (Order through Payment) sufficient?
3. **Status Distribution**: Approve the status distributions above (mix of pending, in-progress, completed)?
4. **Order Items**: 2-3 products per order acceptable?
5. **Payments**: 25-28 payments (some invoices with multiple partial payments) OK?
6. **Proceed**: Ready for me to create and execute the script?

---

**READY TO PROCEED PENDING YOUR APPROVAL**
