# Missing Pages Implementation Plan

**Date:** October 2, 2025
**Status:** IN PROGRESS
**Total Pages to Build:** 8

---

## 🎯 IMPLEMENTATION STRATEGY

### **Architecture Decisions Confirmed:**

1. **Production → Ordered Items** = `ordered_items_production` table (individual unit QC tracking)
2. **Production → Shipments** = Production-specific shipment preparation view
3. **Shipping Module** = Comprehensive SEKO-integrated shipping management (NEW MODULE)
4. **Financials → Invoices** = `invoices` table (general accounting, separate from production_invoices)
5. **Financials → Payments** = `payments` table (all payments dashboard)
6. **Documents** = Global document hub using existing `storage` router

### **Existing tRPC Routers Available:**
✅ `shippingRouter` - 7 procedures (quotes, shipments, tracking, labels)
✅ `productionTrackingRouter` - 7 procedures (milestones, progress, dashboards)
✅ `orderItemsRouter` - 5 procedures (CRUD for order_items)
✅ `storageRouter` - 7 procedures (file management, Google Drive integration)
✅ `productionOrdersRouter` - Already exists
✅ `production InvoicesRouter` - Already exists

### **New tRPC Routers Needed:**
❌ `invoicesRouter` - For general accounting invoices (not production invoices)
❌ `paymentsRouter` - For all payments management
❌ `orderedItemsProductionRouter` - For individual unit tracking (QC focus)

---

## 📋 PAGE-BY-PAGE IMPLEMENTATION PLAN

### **PAGE 1: /production/ordered-items**
**Purpose:** Individual unit QC tracking (`ordered_items_production` table)
**Database:** `ordered_items_production` table (lines 6140-6181 in schema.prisma)
**tRPC Router:** NEED TO CREATE `orderedItemsProductionRouter`
**Reference Page:** `/products/ordered-items` (for UI patterns)

**Key Features:**
- Accordion table showing individual units with SKUs (PO-2025-0045-001 format)
- QC status tracking (pending, pass, fail, repaired)
- Production status per unit (pending, in_production, quality_check, approved, packed, shipped, delivered)
- Shipment assignment per unit
- QC notes and dates
- Search/filter by production order, QC status, shipment

**Database Fields:**
```sql
- sku (unique, e.g., PO-2025-0045-001)
- production_order_id → production_orders
- item_number (1, 2, 3...)
- status (production workflow status)
- qc_status (pass/fail/pending)
- qc_notes, qc_date, qc_by
- shipment_id → shipments
- production_start_date, production_end_date
- shipped_date, delivered_date
```

**tRPC Endpoints Needed:**
```typescript
api.orderedItemsProduction.getAll({ limit, offset, status, qc_status, production_order_id })
api.orderedItemsProduction.getById({ id })
api.orderedItemsProduction.updateQC({ id, qc_status, qc_notes })
api.orderedItemsProduction.updateStatus({ id, status })
api.orderedItemsProduction.assignToShipment({ id, shipment_id })
```

---

### **PAGE 2: /production/shipments**
**Purpose:** Production team shipment preparation view
**Database:** `shipments` table (lines 4421-4469)
**tRPC Router:** ✅ `shippingRouter` (already exists - 7 procedures)
**Reference Page:** `/production/packing` (for UI patterns)

**Key Features:**
- List shipments related to production orders
- Packing job linkage (`packing_job_id`)
- Ready-to-ship status tracking
- Shipment creation from completed production orders
- Integration with `/production/packing` workflow
- Filter by status (pending, in_transit, delivered)

**Available Endpoints:**
```typescript
api.shipping.getAllShipments({ status, project_id, limit, offset })
api.shipping.getShipmentsByOrder({ production_order_id })
api.shipping.createShipment({ production_order_id, origin, destination, packages, carrier, service_level })
```

---

### **PAGE 3: /shipping (Dashboard)**
**Purpose:** Shipping module overview with metrics
**Database:** `shipments` table
**tRPC Router:** ✅ `shippingRouter` + `productionTrackingRouter` (for stats)

**Key Features:**
- Summary stats (pending shipments, in-transit, delivered, total value)
- Recent shipments table
- Shipments by status breakdown
- Shipments by carrier breakdown
- Quick actions (create shipment, track shipment, get quotes)
- Link to `/shipping/shipments` and `/shipping/tracking`

**Available Endpoints:**
```typescript
api.shipping.getAllShipments({ limit: 10, status: 'in_transit' })
api.productionTracking.getDashboardStats() // Adapt for shipping metrics
```

---

### **PAGE 4: /shipping/shipments**
**Purpose:** Comprehensive shipment management with SEKO integration
**Database:** `shipments` table
**tRPC Router:** ✅ `shippingRouter` (complete functionality exists)

**Key Features:**
- Accordion table showing all shipments
- Search/filter by tracking number, order number, carrier, status
- Shipment details (origin, destination, packages, carrier, service level)
- Tracking events display
- Label generation (PDF/ZPL)
- SEKO integration status
- Actions: Track, Get Label, Update Status, View Details

**Available Endpoints:**
```typescript
api.shipping.getAllShipments({ status, carrier_id, project_id, limit, offset })
api.shipping.trackShipment({ tracking_number })
api.shipping.getLabel({ shipment_id, format: 'PDF' | 'ZPL' })
api.shipping.compareCarriers({ production_order_id })
```

---

### **PAGE 5: /shipping/tracking**
**Purpose:** Customer-facing tracking lookup interface
**Database:** `shipments` table + `shipping_events`
**tRPC Router:** ✅ `shippingRouter.trackShipment`

**Key Features:**
- Simple tracking number input field
- Real-time tracking from SEKO API
- Shipment details display (origin, destination, carrier, service level)
- Tracking events timeline
- Estimated/actual delivery dates
- Clean, customer-friendly UI (no admin features)
- Public access (no auth required for tracking lookup)

**Available Endpoints:**
```typescript
api.shipping.trackShipment({ tracking_number })
```

---

### **PAGE 6: /financials/invoices**
**Purpose:** General accounting invoices (NOT production invoices)
**Database:** `invoices` table (line 2839 in schema.prisma)
**tRPC Router:** ❌ NEED TO CREATE `invoicesRouter`

**Key Features:**
- Accordion table showing general accounting invoices
- Search/filter by customer, status, date range
- Invoice line items display
- Payment allocation display
- QuickBooks sync status
- Actions: Create, Edit, Send, Record Payment, Sync to QuickBooks

**Database Fields:**
```sql
invoices table:
- id, invoice_number
- customer_id, project_id (if applicable)
- invoice_date, due_date
- subtotal, tax, total
- amount_paid, amount_due
- status (draft, sent, paid, overdue, cancelled)
- notes

invoice_items table:
- invoice_id, line_number
- description, quantity, unit_price, total
```

**tRPC Endpoints Needed:**
```typescript
api.invoices.getAll({ status, customer_id, limit, offset })
api.invoices.getById({ id })
api.invoices.create({ customer_id, items: [], notes })
api.invoices.update({ id, data })
api.invoices.delete({ id })
api.invoices.recordPayment({ id, amount, payment_method })
```

---

### **PAGE 7: /financials/payments**
**Purpose:** All payments dashboard (production + general)
**Database:** `payments` table (line 13) + `production_payments`
**tRPC Router:** ❌ NEED TO CREATE `paymentsRouter`

**Key Features:**
- Combined view of ALL payment activity
- Tabs: All Payments, Production Payments, General Payments
- Search/filter by customer, payment method, status, date range
- Payment details (amount, method, transaction ID, reference number)
- Invoice allocation display
- QuickBooks sync status
- Summary stats (total received, pending, by payment method)

**Available Endpoints:**
```typescript
// Production payments already exist:
api.productionInvoices.recordPayment({ production_invoice_id, amount, payment_method, transaction_id })

// Need to create for general payments:
api.payments.getAll({ status, customer_id, payment_type, limit, offset })
api.payments.getById({ id })
api.payments.recordPayment({ invoice_id, amount, payment_method, transaction_id, notes })
api.payments.getAllocations({ payment_id })
```

---

### **PAGE 8: /documents**
**Purpose:** Global document hub with Google Drive integration
**Database:** `documents` table (lines 3632-3744)
**tRPC Router:** ✅ `storageRouter` (complete functionality exists)

**Key Features:**
- Grid/List view toggle for document display
- Search/filter by category, subcategory, project, client, order, item
- Upload dialog with drag-and-drop
- Google Drive integration (auto-upload option)
- Document preview (images, PDFs)
- Actions: Upload, Download, Delete, Share, Move to Google Drive
- Tags and metadata management
- Version control and revision history

**Available Endpoints:**
```typescript
api.storage.listFiles({ projectId, briefId, category, storageType, limit, offset })
api.storage.recordUpload({ fileName, fileSize, fileType, category, projectId, storageType, googleDriveId })
api.storage.getFile({ fileId })
api.storage.deleteFile({ fileId })
api.storage.getDownloadUrl({ fileId })
api.storage.getStorageStats()
api.storage.getAccessToken() // For Google Drive
```

---

## 🔧 NEW tRPC ROUTERS TO CREATE

### **1. orderedItemsProductionRouter**
**File:** `/src/server/api/routers/ordered-items-production.ts`
**Table:** `ordered_items_production`

```typescript
export const orderedItemsProductionRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(z.object({
      production_order_id: z.string().uuid().optional(),
      status: z.string().optional(),
      qc_status: z.string().optional(),
      shipment_id: z.string().uuid().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input, ctx }) => {
      // Query ordered_items_production with filters
      // Include production_orders, shipments, users (qc_by)
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // Get single ordered item with full details
    }),

  updateQC: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      qc_status: z.enum(['pass', 'fail', 'pending', 'repaired']),
      qc_notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Update QC status, notes, qc_date, qc_by
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      status: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Update production status
    }),

  assignToShipment: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      shipment_id: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Assign ordered item to shipment
      // Update status to 'shipped' if not already
    }),
});
```

### **2. invoicesRouter**
**File:** `/src/server/api/routers/invoices.ts`
**Table:** `invoices`, `invoice_items`

```typescript
export const invoicesRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      customer_id: z.string().uuid().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input, ctx }) => {
      // Query invoices with invoice_items
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // Get invoice with line items, payment allocations
    }),

  create: protectedProcedure
    .input(z.object({
      customer_id: z.string().uuid(),
      items: z.array(z.object({
        description: z.string(),
        quantity: z.number(),
        unit_price: z.number(),
      })),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Generate invoice_number (INV-YYYY-XXXX)
      // Create invoice + invoice_items
    }),

  recordPayment: protectedProcedure
    .input(z.object({
      invoice_id: z.string().uuid(),
      amount: z.number(),
      payment_method: z.string(),
      transaction_id: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Create payment_allocation record
      // Update invoice amount_paid, status
    }),
});
```

### **3. paymentsRouter**
**File:** `/src/server/api/routers/payments.ts`
**Table:** `payments`, `payment_allocations`

```typescript
export const paymentsRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      customer_id: z.string().uuid().optional(),
      payment_type: z.enum(['production', 'general']).optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ input, ctx }) => {
      // Query payments + payment_allocations
      // Combine production_payments and general payments
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // Get payment with allocations
    }),

  getAllocations: protectedProcedure
    .input(z.object({ payment_id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      // Get payment allocations for a payment
    }),
});
```

---

## 📦 NAVIGATION UPDATES NEEDED

**File:** `/src/components/Sidebar.tsx`

```typescript
// ADD to Production module (lines 159-169):
{
  label: "Production",
  icon: Factory,
  items: [
    { label: "Dashboard", href: "/production/dashboard" },
    { label: "Production Orders", href: "/production/orders" },
    { label: "Ordered Items", href: "/production/ordered-items" }, // ← ADD
    { label: "Shop Drawings", href: "/production/shop-drawings" },
    { label: "Prototypes", href: "/production/prototypes" },
    { label: "Factory Reviews", href: "/production/factory-reviews" },
    { label: "QC Inspections", href: "/production/qc" },
    { label: "Packing & Shipping", href: "/production/packing" },
    { label: "Shipments", href: "/production/shipments" }, // ← ADD
  ]
},

// ADD new Shipping module (after Production):
{
  label: "Shipping",
  icon: Truck,
  items: [
    { label: "Dashboard", href: "/shipping" },
    { label: "Shipments", href: "/shipping/shipments" },
    { label: "Tracking", href: "/shipping/tracking" },
  ]
},

// UPDATE Finance module (lines 172-177):
{
  label: "Finance",
  icon: DollarSign,
  items: [
    { label: "Dashboard", href: "/finance" },
    { label: "Invoices", href: "/financials/invoices" }, // ← ADD
    { label: "Payments", href: "/financials/payments" }, // ← ADD
  ]
},

// ADD new Documents module (after Finance):
{
  label: "Documents",
  icon: FileText,
  href: "/documents", // Single page, not a dropdown
},
```

---

## 🗂️ TEST DATA SEEDING PLAN

### **1. ordered_items_production (20 units)**
```sql
-- Create 20 individual units across 4 production orders
-- 5 units per order with varying QC statuses
INSERT INTO ordered_items_production (sku, production_order_id, item_number, status, qc_status, qc_notes)
VALUES
  ('PO-2025-0001-001', '<prod_order_1_id>', 1, 'quality_check', 'pass', 'All dimensions verified'),
  ('PO-2025-0001-002', '<prod_order_1_id>', 2, 'approved', 'pass', 'Quality approved'),
  ('PO-2025-0001-003', '<prod_order_1_id>', 3, 'in_production', 'pending', NULL),
  ... (17 more rows)
```

### **2. shipments (10 shipments)**
```sql
-- Create 10 shipments with varying statuses
INSERT INTO shipments (shipment_number, order_id, carrier, tracking_number, status, shipped_date, estimated_delivery)
VALUES
  ('SHIP-2025-0001', '<order_id_1>', 'FedEx', '1234567890', 'in_transit', NOW() - INTERVAL '2 days', NOW() + INTERVAL '3 days'),
  ... (9 more rows)
```

### **3. invoices (15 invoices)**
```sql
-- Create 15 general accounting invoices
INSERT INTO invoices (id, created_at, updated_at)
VALUES
  (gen_random_uuid(), NOW(), NOW()),
  ... (14 more rows)

-- Create invoice_items for each invoice
INSERT INTO invoice_items (invoice_id, line_number, description, quantity, unit_price, total)
VALUES ...
```

### **4. payments (20 payments)**
```sql
-- Create 20 payment records
INSERT INTO payments (payment_number, customer_id, payment_date, payment_method, amount, status)
VALUES
  ('PAY-2025-0001', '<customer_id_1>', NOW() - INTERVAL '5 days', 'wire_transfer', 5000, 'completed'),
  ... (19 more rows)
```

### **5. documents (30 files)**
```sql
-- Create 30 document records
INSERT INTO documents (name, original_name, type, category, size, uploaded_by, project_id, status)
VALUES
  ('Project Proposal - Acme Corp.pdf', 'proposal.pdf', 'application/pdf', 'proposals', 2048576, '<user_id>', '<project_id>', 'active'),
  ... (29 more rows)
```

---

## ✅ ACCEPTANCE CRITERIA

Each page MUST have:
- ✅ Authentication guards (`{ enabled: !!user }`)
- ✅ Real database queries (NO mock data)
- ✅ Consistent UI patterns (accordion tables, status badges, filters)
- ✅ Global CSS styling (NO hardcoded colors/styles)
- ✅ Search and filtering functionality
- ✅ Loading states and error handling
- ✅ Responsive design
- ✅ Zero ESLint errors/warnings
- ✅ Zero TypeScript errors
- ✅ Zero build errors
- ✅ Working navigation links

---

## 🎯 IMPLEMENTATION ORDER

1. ✅ Create audit report (DONE)
2. ✅ Create implementation plan (DONE)
3. ⏳ Create new tRPC routers (orderedItemsProduction, invoices, payments)
4. ⏳ Build pages 1-8 systematically
5. ⏳ Update Sidebar navigation
6. ⏳ Seed test data
7. ⏳ Run quality checks
8. ⏳ Test all pages in browser
9. ⏳ Fix any issues found
10. ⏳ Final quality check and commit

---

**Let's build! 🚀**
