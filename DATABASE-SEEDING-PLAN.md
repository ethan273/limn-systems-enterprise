# Comprehensive Database Seeding Plan

**Date**: 2025-10-04
**Database**: limn-systems-enterprise (271 tables total)
**Purpose**: Seed realistic data for comprehensive UI/UX testing across all modules

---

## 🎯 OBJECTIVES

1. **Visual Testing**: Populate all pages with realistic data to verify UI rendering
2. **Functional Testing**: Enable testing of buttons, forms, workflows (Add, Edit, Delete, etc.)
3. **Edge Case Testing**: Include varied data (empty fields, max lengths, special characters, dates, statuses)
4. **Relationship Testing**: Verify foreign key relationships and cascading data displays
5. **Performance Testing**: Add enough data to test pagination, sorting, filtering

---

## 📊 SEEDING STRATEGY

### Phase 1: Core Foundation Tables (HIGHEST PRIORITY)
**Goal**: Seed user authentication and base reference data

#### 1.1 Authentication & Users
- **Tables**: `user_profiles`, `user_roles`, `user_permissions`
- **Data Volume**: 10-15 users with varied roles
- **Roles**: Admin, Manager, Designer, Production, Sales, Customer Service
- **Realistic Data**:
  - Real names (John Smith, Maria Garcia, etc.)
  - Valid email formats
  - Profile photos (avatars)
  - Different creation dates (simulate account age)

#### 1.2 Reference Data (Configuration Tables)
- **Tables**:
  - `materials` (wood, stone, fabric, weaving, etc.)
  - `finishes` (wood finishes, stone finishes, etc.)
  - `colors` (fabric colors, weaving colors, etc.)
  - `shipping_carriers`
  - `tax_rates`
  - `payment_terms`
- **Data Volume**: 20-50 entries per category
- **Why**: Required for dropdowns, filters, and product configurations

---

### Phase 2: CRM Module (HIGH PRIORITY)
**Goal**: Enable testing of all CRM pages

#### 2.1 Contacts
- **Table**: `contacts`
- **Data Volume**: 25-30 contacts
- **Realistic Data**:
  - Varied companies (Acme Corp, Tech Inc, Design Studio, etc.)
  - Job titles (CEO, Designer, Procurement Manager, etc.)
  - Multiple communication channels (email, phone, mobile)
  - Tags (VIP, Partner, Referral, etc.)
  - Different creation dates (spread over 6 months)
  - Mix of complete and partially filled records

#### 2.2 Leads
- **Table**: `leads`
- **Data Volume**: 30-40 leads
- **Realistic Data**:
  - Status: new, contacted, qualified, proposal, negotiation, won, lost
  - Prospect status: hot, warm, cold
  - Lead sources: website, referral, trade show, cold call
  - Value ranges: $5,000 - $500,000
  - Different created/updated dates
  - Assigned to different sales reps

#### 2.3 Customers/Clients
- **Table**: `customers`
- **Data Volume**: 20-25 customers
- **Realistic Data**:
  - Type: residential, commercial, hospitality, designer
  - Status: active, inactive, vip
  - Credit terms: NET30, NET60, COD
  - Billing/shipping addresses
  - Account representatives
  - Customer since dates (varied)

#### 2.4 Projects
- **Table**: `projects`
- **Data Volume**: 15-20 projects
- **Realistic Data**:
  - Project names (Beverly Hills Residence, Manhattan Hotel Lobby, etc.)
  - Status: planning, design, production, completed, cancelled
  - Budget ranges: $10,000 - $1,000,000
  - Start/end dates (past, current, future)
  - Assigned teams and customers
  - Progress percentages

#### 2.5 Prospects
- **Table**: `leads` (with `prospect_status` field)
- **Data Volume**: 15-20 prospects
- **Realistic Data**:
  - Prospect status: hot, warm, cold
  - Different engagement levels
  - Follow-up dates
  - Conversion probability

---

### Phase 3: Products Module (HIGH PRIORITY)
**Goal**: Enable testing of all product pages

#### 3.1 Collections
- **Table**: `collections`
- **Data Volume**: 10-15 collections
- **Realistic Data**:
  - Collection names (Modern Classics, Coastal Living, Industrial Loft, etc.)
  - Status: active, inactive, archived
  - Season: Spring 2025, Fall 2024, etc.
  - Descriptions
  - Launch dates

#### 3.2 Product Catalog
- **Tables**: `items`, `item_images`, `furniture_dimensions`
- **Data Volume**: 40-50 products
- **Realistic Data**:
  - Product types: sofa, chair, table, bed, cabinet, etc.
  - SKUs: SOF-001, CHR-045, TBL-120, etc.
  - Dimensions (width, height, depth in inches and cm)
  - Weights (lbs and kg)
  - Materials (wood, fabric, stone, metal combinations)
  - Prices: $500 - $15,000
  - Status: active, discontinued, coming_soon
  - Stock levels: in_stock, low_stock, out_of_stock, backorder
  - Multiple images per product

#### 3.3 Concepts
- **Table**: `concepts`
- **Data Volume**: 12-15 concepts
- **Realistic Data**:
  - Concept names and descriptions
  - Status: ideation, review, approved, rejected
  - Designer assignments
  - Creation dates

#### 3.4 Prototypes
- **Table**: `prototypes`
- **Data Volume**: 10-12 prototypes
- **Realistic Data**:
  - Prototype versions (V1, V2, V3)
  - Status: in_development, testing, approved, rejected
  - Related concepts
  - Test results
  - Approval workflows

---

### Phase 4: Orders & Production (HIGH PRIORITY)
**Goal**: Enable testing of order and production workflows

#### 4.1 Orders
- **Table**: `orders`
- **Data Volume**: 30-40 orders
- **Realistic Data**:
  - Order numbers: ORD-2025-001, ORD-2025-002, etc.
  - Status: draft, pending, confirmed, in_production, shipped, delivered, cancelled
  - Order dates (spread over 3-6 months)
  - Customers linked
  - Total amounts: $1,000 - $100,000
  - Payment status: pending, partial, paid, overdue
  - Different sales reps

#### 4.2 Order Items
- **Table**: `order_items`
- **Data Volume**: 80-120 items (2-4 items per order average)
- **Realistic Data**:
  - Products from catalog
  - Quantities: 1-20
  - Custom specifications
  - Unit prices and totals
  - Discounts (some orders)

#### 4.3 Production Orders
- **Table**: `production_orders`
- **Data Volume**: 25-35 production orders
- **Realistic Data**:
  - Production order numbers: PRD-2025-001, etc.
  - Status: pending, in_progress, quality_check, completed, shipped
  - Priority: low, medium, high, urgent
  - Assigned factories
  - Start/completion dates
  - Linked to customer orders

#### 4.4 Shop Drawings
- **Table**: `shop_drawings`
- **Data Volume**: 20-25 shop drawings
- **Realistic Data**:
  - Drawing numbers: SD-001, SD-002, etc.
  - Status: draft, submitted, under_review, approved, rejected, revision_needed
  - Versions (multiple revisions)
  - Approval workflows
  - Comments and feedback
  - Related production orders

#### 4.5 QC Inspections
- **Table**: `qc_inspections`
- **Data Volume**: 30-40 inspections
- **Realistic Data**:
  - Inspection dates
  - Status: scheduled, in_progress, passed, failed, conditional
  - Inspector assignments
  - Linked production orders
  - Defect counts
  - Pass/fail criteria

---

### Phase 5: Shipping & Logistics (HIGH PRIORITY)
**Goal**: Enable testing of shipping workflows

#### 5.1 Shipments
- **Table**: `shipments`
- **Data Volume**: 35-45 shipments
- **Realistic Data**:
  - Shipment numbers: SHP-2025-001, etc.
  - Status: pending, preparing, ready, shipped, in_transit, delivered, delayed, cancelled
  - Carriers: FedEx, UPS, DHL, freight companies
  - Tracking numbers (realistic formats)
  - Shipped/delivered dates (past and in-transit)
  - Origin/destination addresses
  - Package counts
  - Weight/dimensions

#### 5.2 Shipping Tracking
- **Table**: `shipping_tracking`
- **Data Volume**: 50-70 tracking events
- **Realistic Data**:
  - Event types: picked_up, in_transit, out_for_delivery, delivered, exception
  - Timestamps (chronological)
  - Locations (realistic cities/states)
  - Status updates

---

### Phase 6: Financial Module (MEDIUM PRIORITY)
**Goal**: Enable testing of financial pages

#### 6.1 Invoices
- **Table**: `invoices`
- **Data Volume**: 30-40 invoices
- **Realistic Data**:
  - Invoice numbers: INV-2025-001, etc.
  - Status: draft, sent, viewed, paid, overdue, cancelled
  - Issue/due dates
  - Amounts: $1,000 - $100,000
  - Linked to orders and customers
  - Payment terms: NET30, NET60, COD

#### 6.2 Invoice Items
- **Table**: `invoice_items`
- **Data Volume**: 80-120 line items
- **Realistic Data**:
  - Descriptions
  - Quantities and prices
  - Tax calculations
  - Discounts

#### 6.3 Payments
- **Table**: `payments`
- **Data Volume**: 35-45 payments
- **Realistic Data**:
  - Payment methods: credit_card, wire_transfer, check, ACH
  - Amounts
  - Payment dates
  - Reference numbers
  - Linked invoices
  - Status: pending, processed, failed, refunded

---

### Phase 7: Tasks & Collaboration (MEDIUM PRIORITY)
**Goal**: Enable testing of task management

#### 7.1 Tasks
- **Table**: `tasks`
- **Data Volume**: 50-70 tasks
- **Realistic Data**:
  - Task titles and descriptions
  - Status: todo, in_progress, completed, cancelled
  - Priority: low, medium, high, urgent
  - Department: admin, production, design, sales
  - Assigned users
  - Due dates (past, today, future, overdue)
  - Created/updated dates
  - Tags and categories

#### 7.2 Task Comments
- **Table**: `task_comments`
- **Data Volume**: 80-100 comments
- **Realistic Data**:
  - Comment text
  - Authors
  - Timestamps
  - Mentions (@username)

---

### Phase 8: Partners Module (MEDIUM PRIORITY)
**Goal**: Enable testing of partner management

#### 8.1 Designers
- **Table**: `designers`
- **Data Volume**: 12-15 designers
- **Realistic Data**:
  - Designer/studio names
  - Contact info
  - Specialties (modern, traditional, custom, etc.)
  - Status: active, inactive
  - Performance ratings
  - Contract details

#### 8.2 Factories/Manufacturers
- **Table**: `manufacturers`
- **Data Volume**: 8-12 factories
- **Realistic Data**:
  - Factory names
  - Locations (different countries)
  - Capabilities (wood, metal, upholstery, etc.)
  - Quality ratings
  - Lead times
  - Capacity
  - Contact info

---

### Phase 9: Documents Module (LOW PRIORITY)
**Goal**: Enable testing of document management

#### 9.1 Documents
- **Table**: `documents`
- **Data Volume**: 30-40 documents
- **Realistic Data**:
  - Document types: contract, invoice, drawing, photo, spec_sheet
  - File names and paths
  - Upload dates
  - Owners/uploaders
  - Tags and categories
  - Access permissions
  - Versions

---

### Phase 10: Design Module (LOW PRIORITY)
**Goal**: Enable testing of design workflows

#### 10.1 Design Briefs
- **Table**: `design_briefs`
- **Data Volume**: 10-15 briefs
- **Realistic Data**:
  - Project names
  - Client requirements
  - Status: draft, submitted, in_review, approved
  - Designers assigned

#### 10.2 Design Files
- **Table**: `design_files`
- **Data Volume**: 25-30 files
- **Realistic Data**:
  - File types: CAD, rendering, sketch, mood_board
  - Versions
  - Linked briefs/projects

---

## 🛠️ IMPLEMENTATION APPROACH

### Option 1: TypeScript Seeding Scripts (RECOMMENDED)
**Pros**:
- Type-safe with Prisma
- Easy to maintain and extend
- Can use faker.js for realistic data generation
- Better error handling
- Reusable functions

**Structure**:
```
/scripts/seed/
  ├── index.ts           # Main orchestrator
  ├── utils/
  │   ├── faker.ts       # Faker.js utilities
  │   └── helpers.ts     # Common seeding helpers
  ├── foundation/
  │   ├── users.ts       # Seed users and roles
  │   └── reference.ts   # Seed reference data
  ├── crm/
  │   ├── contacts.ts
  │   ├── leads.ts
  │   ├── customers.ts
  │   └── projects.ts
  ├── products/
  │   ├── collections.ts
  │   ├── catalog.ts
  │   ├── concepts.ts
  │   └── prototypes.ts
  ├── orders/
  │   ├── orders.ts
  │   ├── production.ts
  │   ├── shop-drawings.ts
  │   └── qc.ts
  ├── shipping/
  │   ├── shipments.ts
  │   └── tracking.ts
  ├── financial/
  │   ├── invoices.ts
  │   └── payments.ts
  ├── tasks/
  │   └── tasks.ts
  ├── partners/
  │   ├── designers.ts
  │   └── factories.ts
  ├── documents/
  │   └── documents.ts
  └── design/
      └── design-briefs.ts
```

**Execution**:
```bash
npm run seed              # Seed everything
npm run seed:crm          # Seed CRM module only
npm run seed:products     # Seed Products module only
npm run seed:clean        # Clean test data (optional)
```

### Option 2: SQL Scripts
**Pros**:
- Faster execution
- Direct database access
- Good for large datasets

**Cons**:
- No type safety
- Harder to maintain
- Manual foreign key management

---

## 📋 EXECUTION PLAN

### Step 1: Setup Dependencies
```bash
npm install --save-dev @faker-js/faker
```

### Step 2: Create Seeding Framework
- Base seeding utilities
- Faker.js configuration
- Logging system
- Error handling

### Step 3: Seed by Phase (Sequential)
1. Phase 1: Foundation (users, reference data)
2. Phase 2: CRM (depends on Phase 1)
3. Phase 3: Products (depends on Phase 1)
4. Phase 4: Orders & Production (depends on Phase 2 & 3)
5. Phase 5: Shipping (depends on Phase 4)
6. Phase 6: Financial (depends on Phase 2 & 4)
7. Phase 7: Tasks (depends on Phase 1)
8. Phase 8: Partners (depends on Phase 1)
9. Phase 9: Documents (depends on all)
10. Phase 10: Design (depends on Phase 1 & 2)

### Step 4: Verification
- Run data count queries
- Verify foreign key relationships
- Check data quality
- Test pages visually

---

## 🎲 DATA GENERATION STRATEGY

### Realistic Data with Faker.js
```typescript
import { faker } from '@faker-js/faker';

// Names
faker.person.fullName()
faker.person.firstName()
faker.person.lastName()

// Companies
faker.company.name()
faker.company.buzzPhrase()

// Addresses
faker.location.streetAddress()
faker.location.city()
faker.location.state()
faker.location.zipCode()

// Contact
faker.internet.email()
faker.phone.number()

// Dates
faker.date.past({ years: 1 })
faker.date.future({ years: 1 })
faker.date.between({ from: '2024-01-01', to: '2025-12-31' })

// Numbers
faker.number.int({ min: 1000, max: 100000 })
faker.finance.amount({ min: 100, max: 10000, dec: 2 })

// Text
faker.lorem.paragraph()
faker.lorem.sentence()
```

### Status Distribution
- 60% active/in-progress statuses
- 25% completed/successful statuses
- 10% pending/draft statuses
- 5% cancelled/failed statuses

### Date Distribution
- 40% historical data (past 3-6 months)
- 40% current data (this month)
- 20% future data (next 1-3 months)

---

## ⚠️ IMPORTANT CONSIDERATIONS

### 1. Foreign Key Constraints
- Must seed in correct order (parent tables before child tables)
- Maintain referential integrity
- Use realistic ID references

### 2. Data Cleanup Strategy
- Tag all seeded data with `is_seed_data: true` metadata field (if available)
- OR: Create specific seed user IDs that can be filtered
- OR: Use specific date ranges for seed data

### 3. Performance
- Batch inserts (100-500 records at a time)
- Use transactions for related data
- Disable triggers temporarily if needed
- Consider parallel seeding for independent tables

### 4. Existing Data
- Check for existing data before seeding
- Skip tables that already have sufficient data
- Merge strategy for partial data

---

## 📊 SUCCESS METRICS

After seeding, we should have:
- ✅ All CRM pages showing realistic data (contacts, leads, customers, projects, orders)
- ✅ All Product pages showing full catalog with images and specs
- ✅ All Production pages showing active workflows
- ✅ All Shipping pages showing various shipment statuses
- ✅ All Financial pages showing invoices and payments
- ✅ All Task pages showing assigned tasks with various statuses
- ✅ All Partner pages showing designers and factories
- ✅ Pagination working on all tables (20+ records per module)
- ✅ Filters working with varied data
- ✅ Sorting working with different values
- ✅ Search functionality testable with realistic data
- ✅ Detail pages showing complete information
- ✅ Edit forms pre-populating with data
- ✅ Delete confirmations working

---

## ❓ QUESTIONS FOR APPROVAL

1. **Approach**: Do you approve TypeScript/Prisma seeding scripts with faker.js? (RECOMMENDED)
2. **Data Volume**: Are the proposed record counts sufficient? (20-50 per major table)
3. **Phase Priority**: Should I start with Phases 1-5 (Foundation + CRM + Products + Orders + Shipping) first?
4. **Cleanup Strategy**: Do you want ability to easily delete all seed data later?
5. **Images**: Should I generate placeholder images for products/users, or use existing image URLs?
6. **Execution**: Should I create a single `npm run seed:all` command, or modular commands per module?
7. **Dependencies**: OK to install `@faker-js/faker` as dev dependency?

---

## 🚀 NEXT STEPS (PENDING YOUR APPROVAL)

1. **Approve this plan** with any modifications
2. **Install dependencies** (@faker-js/faker)
3. **Create seeding framework** (utilities, helpers, logging)
4. **Seed Phase 1** (Foundation: users, reference data)
5. **Seed Phase 2** (CRM module)
6. **Seed Phase 3** (Products module)
7. **Seed Phase 4** (Orders & Production)
8. **Seed Phase 5** (Shipping)
9. **Verify visually** on all pages
10. **Document results** and any issues found

**Estimated Time**: 4-6 hours for complete seeding implementation (all 10 phases)

---

**READY TO PROCEED PENDING YOUR APPROVAL AND ANSWERS TO QUESTIONS ABOVE**
