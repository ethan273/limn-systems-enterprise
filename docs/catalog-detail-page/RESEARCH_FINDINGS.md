# Research Findings - Catalog Item Detail Page

**Created**: October 2, 2025
**Research Phase**: Pre-Implementation Analysis
**Module**: Products / Catalog

---

## 🔍 DATABASE SCHEMA RESEARCH

### **Primary Table: `items` (Catalog Items)**

**Purpose**: Stores catalog items that are production-ready

**Key Fields Identified**:
```prisma
model items {
  id                   String   @id @default(uuid()) @db.Uuid
  base_sku             String   @unique @db.VarChar(50)  // ✅ EXISTS
  name                 String   @db.VarChar(200)
  furniture_type       String   @db.VarChar(100)
  list_price           Decimal  @db.Decimal(10, 2)
  active               Boolean  @default(true)
  collection_id        String?  @db.Uuid

  // Relations discovered
  collections          collections?  @relation(fields: [collection_id])
  item_images          item_images[]
  furniture_dimensions furniture_dimensions[]
  order_items          order_items[]
  documents            documents[]
}
```

**Findings**:
- ✅ `base_sku` field already exists (unique, VARCHAR(50))
- ✅ Collection relationship exists for "View Collection" link
- ✅ Image relationship exists via `item_images` table
- ✅ Dimension relationship exists via `furniture_dimensions` table
- ✅ Order items relationship exists for sales analytics

---

### **Missing Field: `order_items.full_sku`**

**Current State**: Field does NOT exist
**Current Schema**:
```prisma
model order_items {
  id             String   @id @default(uuid()) @db.Uuid
  order_id       String   @db.Uuid
  item_id        String   @db.Uuid  // Links to catalog item
  project_sku    String?  // ✅ EXISTS
  // full_sku    String?  // ❌ DOES NOT EXIST - NEED TO ADD
  specifications Json?    // ✅ EXISTS - stores material selections
  quantity       Int
  unit_price     Decimal
}
```

**Required Change**:
```prisma
model order_items {
  // ... existing fields
  full_sku       String?  @db.VarChar(200)  // ADD THIS FIELD
}
```

**Migration Required**: YES - Prisma schema update needed

---

## 📊 MATERIAL TABLES ANALYSIS

### **Issue: No SKU Fields in Material Tables**

**Tables Analyzed**:
- `fabric_colors`
- `wood_finishes`
- `metal_finishes`
- `stone_types`
- `weaving_patterns`
- `carving_styles`

**Schema Pattern**:
```prisma
model fabric_colors {
  id             String   @id @default(uuid())
  name           String   // ✅ EXISTS (e.g., "Navy Blue")
  // sku         String   // ❌ DOES NOT EXIST
  price_modifier Decimal? // ✅ EXISTS
  brand          String?
  collection     String?
}
```

**Finding**: Material tables have NO `sku` fields, only `name` fields

**Solution**: Generate SKU components from material names using abbreviation logic
- **Input**: "Navy Blue"
- **Output**: "NAV"
- **Full Component**: "FAB-NAV"

**Implementation Location**: `/src/lib/utils/full-sku-generator.ts`

---

## 🖼️ IMAGE MANAGEMENT SYSTEM

### **Table: `item_images`**

**Purpose**: Stores product images with sorting and categorization

**Schema**:
```prisma
model item_images {
  id          String  @id @default(uuid())
  item_id     String  @db.Uuid
  image_url   String
  image_type  String? // "primary", "detail", "lifestyle", "dimension"
  is_primary  Boolean @default(false)
  sort_order  Int     @default(0)

  items  items  @relation(fields: [item_id])
}
```

**Usage on Catalog Detail Page**:
- **Overview Tab**: Image carousel showing all product images
- **Sort by**: `sort_order` ASC
- **Filter by**: `is_primary = true` for hero image
- **Types**: Display all image types (primary, detail, lifestyle, dimension)

**Component Reuse**: `/src/components/furniture/ImageManager.tsx` (already exists from catalog list page)

---

## 📐 DIMENSIONS SYSTEM

### **Table: `furniture_dimensions`**

**Purpose**: Comprehensive dimension data with dual units (inches + cm)

**Schema Excerpt**:
```prisma
model furniture_dimensions {
  id                  String   @id @default(uuid())
  item_id             String   @db.Uuid

  // Universal dimensions
  height_inches       Decimal?
  height_cm           Decimal?
  width_inches        Decimal?
  width_cm            Decimal?
  depth_inches        Decimal?
  depth_cm            Decimal?

  // Weight
  weight_lbs_new      Decimal?
  weight_kg           Decimal?  // Auto-calculated: lbs * 0.453592

  // Clearance
  clearance_required_new_inches  Decimal?
  clearance_required_new_cm      Decimal?

  items  items  @relation(fields: [item_id])
}
```

**Usage on Catalog Detail Page**:
- **Overview Tab**: Display all dimensions in dual units
- **Format**: "Height: 36" (91.44 cm)"
- **Auto-conversion**: kg calculated from lbs, cm from inches

**Component Reuse**: `/src/components/furniture/DimensionDisplay.tsx` (already exists, recently fixed for dual units)

---

## 🔍 QUALITY CONTROL SYSTEM

### **Table: `qc_inspections`**

**Purpose**: Quality control inspection records

**Schema**:
```prisma
model qc_inspections {
  id              String    @id @default(uuid())
  order_item_id   String    @db.Uuid  // ✅ Links to order_items
  inspection_date DateTime
  inspection_stage String   // "pre_production", "in_production", "final"
  status          String    // "passed", "failed", "conditional"
  defects_found   Int       @default(0)
  inspector_id    String?   @db.Uuid
  notes           String?

  order_items  order_items  @relation(fields: [order_item_id])
}
```

**Data Flow for Catalog Item QC**:
```
items.id
  → order_items.item_id  (find all orders for this catalog item)
  → qc_inspections.order_item_id  (find all QC inspections)
```

**Usage on Quality Tab**:
- **Summary Stats**: Total inspections, pass rate, avg defects
- **Recent Inspections**: Last 5 inspections with key details
- **Detail Links**: Link to `/production/qc/[inspection_id]` for full report

**Query Strategy**:
```sql
SELECT qi.*
FROM qc_inspections qi
JOIN order_items oi ON qi.order_item_id = oi.id
WHERE oi.item_id = 'catalog-item-uuid'
ORDER BY qi.inspection_date DESC
LIMIT 5
```

---

## 📁 DOCUMENT MANAGEMENT SYSTEM

### **Table: `documents`**

**Purpose**: Hybrid storage system (Supabase + Google Drive)

**Schema**:
```prisma
model documents {
  id                 String    @id @default(uuid())
  item_id            String?   @db.Uuid  // ✅ EXISTS - supports catalog items
  project_id         String?   @db.Uuid

  // Document metadata
  document_type      String    // "CAD", "PDF", "3D_MODEL", "CERTIFICATION", etc.
  file_name          String
  file_size          Int?
  mime_type          String?

  // Hybrid storage fields
  storage_location   String    // "supabase" or "google_drive"
  supabase_path      String?   // Path in Supabase storage
  google_drive_id    String?   // Google Drive file ID
  google_drive_url   String?   // Direct URL to Google Drive file

  // Relations
  items  items?  @relation(fields: [item_id])
}
```

**Storage Routing Logic** (from Design Module):
- **File Size < 50MB**: Store in Supabase Storage
- **File Size ≥ 50MB**: Store in Google Drive (OAuth already configured)
- **CAD Files**: Typically large → Google Drive
- **PDFs/Images**: Typically small → Supabase

**Usage on Documents Tab**:
- **Full CRUD**: Upload, download, edit metadata, delete
- **Drag & Drop**: Reuse `FileUploader` component from Design module
- **Filtering**: Filter by `document_type`
- **Search**: Search by `file_name`
- **Storage Badges**: Display "Supabase" or "Google Drive" badge

**Component Reuse**: `/src/components/design/FileUploader.tsx` (already exists with Google Drive integration)

---

## 📊 SALES ANALYTICS DATA SOURCES

### **Aggregation Strategy**

**Primary Query**: Use `order_items` table with `item_id` foreign key

```sql
-- Total units sold
SELECT SUM(quantity) as total_units
FROM order_items
WHERE item_id = 'catalog-item-uuid'

-- Total revenue
SELECT SUM(quantity * unit_price) as total_revenue
FROM order_items
WHERE item_id = 'catalog-item-uuid'

-- Order count
SELECT COUNT(DISTINCT order_id) as order_count
FROM order_items
WHERE item_id = 'catalog-item-uuid'
```

**Why `item_id` over SKU pattern matching?**
- ✅ More reliable (foreign key constraint)
- ✅ Faster (indexed field)
- ✅ Handles SKU changes over time
- ✅ No regex/LIKE pattern complexity

**Alternative**: Can also use `WHERE full_sku LIKE 'CC-CHA-001%'` for flexibility

---

### **Material Combinations Analysis**

**Data Source**: `order_items.specifications` JSON field

**Schema** (from SPECIFICATIONS_JSON_SCHEMA.md):
```json
{
  "materials": {
    "fabric": {
      "type": "upholstery",
      "brand": "Maharam",
      "collection": "Divina",
      "color": "Navy",
      "sku": "MAH-DIV-540",
      "price_modifier": 150.00
    },
    "wood": { ... },
    "metal": { ... }
  }
}
```

**PostgreSQL JSON Query**:
```sql
-- Find orders with specific fabric color
SELECT *
FROM order_items
WHERE specifications->'materials'->'fabric'->>'color' = 'Navy'
  AND item_id = 'catalog-item-uuid'

-- Aggregate by fabric color
SELECT
  specifications->'materials'->'fabric'->>'color' as fabric_color,
  COUNT(*) as order_count
FROM order_items
WHERE item_id = 'catalog-item-uuid'
GROUP BY fabric_color
ORDER BY order_count DESC
```

**TypeScript Processing**:
```typescript
// Group by full material combo
const combos = orderItems
  .map(item => ({
    fabric: item.specifications.materials.fabric?.color,
    wood: item.specifications.materials.wood?.finish,
    metal: item.specifications.materials.metal?.finish,
  }))
  .reduce((acc, combo) => {
    const key = JSON.stringify(combo);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

// Result: { '{"fabric":"Navy","wood":"Oak","metal":"Brushed Nickel"}': 45 }
```

---

## 🔧 EXISTING UTILITIES & COMPONENTS

### **Reusable Components Found**

**1. `/src/components/furniture/DimensionDisplay.tsx`**
- **Status**: EXISTS (recently fixed for dual units)
- **Usage**: Overview Tab - display all dimensions
- **Features**: Auto-conversion (inches↔cm, lbs↔kg), smart grouping

**2. `/src/components/furniture/ImageManager.tsx`**
- **Status**: EXISTS (used on catalog list page)
- **Usage**: Overview Tab - image carousel
- **Features**: Primary image selection, sort order, image types

**3. `/src/components/design/FileUploader.tsx`**
- **Status**: EXISTS (from Design Module with Google Drive)
- **Usage**: Documents Tab - drag-and-drop file upload
- **Features**: Hybrid storage routing, progress tracking, OAuth

**4. shadcn/ui Components**
- **Tabs**: `/src/components/ui/tabs.tsx` - 4-tab structure
- **Badge**: `/src/components/ui/badge.tsx` - Status, priority, storage type badges
- **Card**: `/src/components/ui/card.tsx` - Summary stat cards
- **Table**: `/src/components/ui/table.tsx` - Order history, QC inspections
- **Dialog**: `/src/components/ui/dialog.tsx` - Delete confirmations

**5. Recharts**
- **Library**: Already installed in package.json
- **Usage**: Sales trend chart (LineChart, AreaChart)
- **Data**: Last 30/60/90 days order volume

---

### **Existing Utilities**

**1. `/src/lib/utils/base-sku-generator.ts`**
- **Status**: EXISTS
- **Function**: Generate Base SKU for catalog items
- **Format**: `{COLLECTION_PREFIX}-{ITEM_NAME_ABBR}-{VARIATION}-{SEQ}`
- **Example**: "IN-DINI-001" (Inyo Dining Chair #001)

**2. `/src/lib/utils/project-sku-generator.ts`**
- **Status**: EXISTS (from orders router)
- **Function**: Generate Project SKU for client tracking
- **Format**: `{CLIENT_CODE}-{YEAR}-{PROJECT}-{ITEM_SEQ}`
- **Example**: "ACME-24-DEV-001.001"

**3. `/src/lib/utils/dimension-validation.ts`**
- **Status**: EXISTS (recently enhanced)
- **Function**: Validate and group furniture dimensions
- **Features**: Field pairing, unit conversion, furniture-type categorization

---

## 🌐 API ROUTER ANALYSIS

### **Existing Router: `/src/server/api/routers/catalog.ts`**

**Current State**: Basic CRUD router generated

**Existing Procedures**:
- `create` - Create catalog item
- `getAll` - List all catalog items
- `getById` - Get single catalog item (BASIC - no relations)
- `update` - Update catalog item
- `delete` - Delete catalog item

**Enhancements Needed**:
1. **`getCatalogItemById`** - Enhanced version with full relations
   ```typescript
   include: {
     collections: true,
     item_images: { orderBy: { sort_order: 'asc' } },
     furniture_dimensions: true,
     order_items: { select: { id: true, specifications: true, full_sku: true } }
   }
   ```

2. **`getSalesAnalytics`** - New procedure
   ```typescript
   input: { itemId: string, dateFrom?: Date, dateTo?: Date }
   output: {
     totalUnits: number,
     totalRevenue: number,
     orderCount: number,
     avgOrderValue: number
   }
   ```

3. **`getPopularMaterials`** - New procedure
   ```typescript
   input: { itemId: string, limit?: number }
   output: Array<{
     combo: string,
     count: number,
     percentage: number
   }>
   ```

---

### **Existing Router: `/src/server/api/routers/storage.ts`**

**Current State**: Handles document storage operations

**Enhancements Needed**:
1. **`getDocumentsByCatalogItem`** - New procedure
   ```typescript
   input: { itemId: string, documentType?: string }
   output: documents[]
   ```

2. **Reuse Existing**:
   - `uploadDocument` - Already handles hybrid routing
   - `deleteDocument` - Already handles both Supabase and Google Drive
   - `updateDocumentMetadata` - Already exists

---

### **Existing Router: `/src/server/api/routers/qc.ts`**

**Current State**: Basic QC inspection CRUD (if exists)

**Enhancements Needed**:
1. **`getInspectionsByCatalogItem`** - New procedure
   ```typescript
   input: { itemId: string, limit?: number }
   output: {
     inspections: qc_inspections[],
     summary: {
       totalInspections: number,
       passRate: number,
       avgDefects: number,
       lastInspectionDate: Date
     }
   }
   ```

---

### **Update Needed: `/src/server/api/routers/order-items.ts`**

**Current Create Logic** (lines 256-288):
```typescript
createWithItems: publicProcedure
  .input(z.object({ ... }))
  .mutation(async ({ ctx, input }) => {
    const orderItemData = {
      order_id: order.id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      client_sku: item.project_sku,
      description: item.product_name,
      specifications: { ... },  // ✅ Already stores JSON
      status: 'pending',
      // full_sku: ???  // ❌ NOT GENERATED YET
    };

    // ... insert order item
  });
```

**Enhancement Required**:
1. Import Full SKU generator utility
2. Fetch catalog item's `base_sku`
3. Generate Full SKU from base_sku + material selections
4. Store in `full_sku` field

**Pseudocode**:
```typescript
// Fetch catalog item
const catalogItem = await ctx.db.items.findUnique({
  where: { id: item.item_id },
  select: { base_sku: true }
});

// Generate Full SKU
const fullSku = generateFullSku(
  catalogItem.base_sku,
  item.material_selections
);

// Store in order item
const orderItemData = {
  // ... existing fields
  full_sku: fullSku,  // ✅ NOW STORED
};
```

---

## 🎨 GLOBAL CSS ARCHITECTURE

### **Existing Patterns** (from `/src/app/globals.css`)

**Theme Variables**:
```css
:root {
  --background: 220 13% 96%;
  --foreground: 222 47% 11%;
  --primary: 221 83% 53%;
  --border: 220 13% 91%;
  /* ... complete theme system */
}

.dark {
  --background: 217 19% 10%;
  --foreground: 213 31% 91%;
  /* ... dark mode overrides */
}
```

**Component Classes** (already defined):
- `.sidebar`, `.header`, `.main-content` - Layout
- `.card`, `.card-title`, `.card-content` - Cards
- `.badge-success`, `.badge-warning`, `.badge-error` - Status indicators
- `.btn-primary`, `.btn-secondary` - Buttons
- `.table`, `.table-header`, `.table-row` - Tables

**New Classes Needed for Catalog Detail**:
```css
/* Catalog detail page layout */
.catalog-detail-layout { ... }
.catalog-detail-header { ... }
.catalog-detail-tabs { ... }

/* Overview tab components */
.catalog-image-carousel { ... }
.catalog-specs-table { ... }
.catalog-dimension-display { ... }

/* Sales analytics components */
.sales-summary-cards { ... }
.sales-chart-container { ... }
.material-combo-list { ... }
.order-history-table { ... }

/* Documents tab components */
.documents-grid { ... }
.document-card { ... }
.document-upload-area { ... }

/* Quality tab components */
.qc-summary-cards { ... }
.qc-inspections-table { ... }
```

---

## 🔐 AUTHENTICATION & AUTHORIZATION

### **Current System**: Supabase Auth + tRPC Context

**Finding**: All API routes already protected via tRPC context

**Router Pattern** (from existing routers):
```typescript
export const catalogRouter = createTRPCRouter({
  getAll: publicProcedure  // ❌ Currently public
    .input(z.object({ ... }))
    .query(async ({ ctx, input }) => {
      // ctx.session available (if authenticated)
      // ctx.db available (Prisma client)
    }),
});
```

**Consideration**: Should catalog detail page require authentication?
- **Public Catalog**: NO auth required (allow browsing)
- **Sales Analytics**: YES auth required (internal data)
- **Documents**: YES auth required (sensitive files)
- **Quality Data**: YES auth required (internal QC data)

**Solution**: Use `protectedProcedure` for sensitive endpoints
```typescript
getSalesAnalytics: protectedProcedure  // ✅ Requires auth
  .input(z.object({ itemId: z.string().uuid() }))
  .query(async ({ ctx, input }) => { ... })
```

---

## 📱 NAVIGATION INTEGRATION

### **Existing Navigation**: `/src/components/Sidebar.tsx`

**Current Products Module Links** (lines 150-160):
```typescript
{
  label: "Products",
  icon: Package,
  items: [
    { label: "Collections", href: "/products/collections" },
    { label: "Materials", href: "/products/materials" },
    { label: "Concepts", href: "/products/concepts" },
    { label: "Prototypes", href: "/products/prototypes" },
    { label: "Catalog", href: "/products/catalog" },  // ✅ Exists
    { label: "Ordered", href: "/products/ordered-items" },
  ]
}
```

**Finding**: Catalog link already exists, no navigation changes needed

**Detail Page Route**: Dynamic route `/products/catalog/[id]` automatically handled by Next.js App Router

---

## 🚀 PERFORMANCE CONSIDERATIONS

### **Database Query Optimization**

**Potential N+1 Query Issues**:
1. **Order Items + QC Inspections**: Fetch in single query with `include`
2. **Material Combinations**: Use PostgreSQL JSON aggregation over TypeScript loops
3. **Sales Analytics**: Consider materialized view for large datasets

**Indexing Recommendations**:
```sql
-- Speed up item_id lookups
CREATE INDEX idx_order_items_item_id ON order_items(item_id);

-- Speed up QC lookups
CREATE INDEX idx_qc_inspections_order_item_id ON qc_inspections(order_item_id);

-- Speed up document lookups
CREATE INDEX idx_documents_item_id ON documents(item_id);
```

**Finding**: Most indexes likely already exist via Prisma foreign keys

---

### **Image Loading Optimization**

**Strategy**: Use Next.js `<Image>` component with optimizations
```typescript
<Image
  src={image.image_url}
  alt={catalogItem.name}
  width={800}
  height={600}
  priority={image.is_primary}  // Priority load for primary image
  loading={!image.is_primary ? "lazy" : undefined}  // Lazy load others
/>
```

**Finding**: `ImageManager` component likely already implements this

---

## 🧪 TESTING STRATEGY

### **Data Seeding Requirements**

**Tables to Seed**:
1. **items** - 10-20 production-ready catalog items
2. **item_images** - 3-5 images per item (primary + details)
3. **furniture_dimensions** - Complete dimensions for each item
4. **order_items** - 50-100 orders with varied material selections
5. **qc_inspections** - 10-20 inspections for some order items
6. **documents** - 5-10 documents per catalog item (CAD, PDF, certifications)

**Realistic Test Data**:
- Varied furniture types (chairs, tables, sofas, cabinets)
- Different collections (Coastal, Inyo, Pacifica)
- Multiple material combinations (Navy fabric + Oak wood, Charcoal + Walnut, etc.)
- Date ranges (last 90 days for trend analysis)
- QC statuses (passed, failed, conditional)

---

### **Functional Testing Checklist**

**Overview Tab**:
- [ ] Image carousel displays all images
- [ ] Specifications table shows complete data
- [ ] Dimensions display in dual units (inches + cm)
- [ ] Base SKU displays correctly
- [ ] Collection link navigates to collection detail
- [ ] List price displays
- [ ] Status badges render

**Sales Analytics Tab**:
- [ ] Summary stats calculate correctly (units, revenue, order count)
- [ ] Material combinations parse from JSON specifications
- [ ] Order history table displays and sorts
- [ ] Date range selector works (30/60/90 days + custom)
- [ ] Sales trend chart renders with real data
- [ ] Empty state displays when no orders

**Documents Tab**:
- [ ] Document list displays with correct badges (Supabase vs Google Drive)
- [ ] Document type filter works
- [ ] File search functions
- [ ] Upload button opens file picker
- [ ] Drag & drop upload works
- [ ] Download button retrieves files
- [ ] Delete button with confirmation works
- [ ] Edit metadata form works

**Quality & QC Tab**:
- [ ] Summary stats cards display correctly
- [ ] Recent inspections table shows last 5
- [ ] QC detail page links work
- [ ] Defect rate chart renders
- [ ] Empty state displays when no inspections

---

## 🎯 KEY DESIGN DECISIONS

### **1. Store Full SKU vs Generate On-Demand**

**Decision**: STORE in `order_items.full_sku` field

**Rationale**:
- ✅ Material names in catalog may change over time
- ✅ Historical accuracy preserved (old SKUs stay intact)
- ✅ Performance (no JSON parsing on every query)
- ✅ Direct SQL queries: `WHERE full_sku LIKE 'CC-CHA-001%'`
- ✅ Client communication (printed on invoices, labels)
- ✅ Manufacturing efficiency (production orders grouped by Full SKU)

**Alternative Considered**: Generate from `base_sku + specifications` on-demand
**Rejected Because**: Material names change, breaks historical records

---

### **2. Material SKU Components Without Material Table SKUs**

**Decision**: Generate SKU abbreviations from material names dynamically

**Rationale**:
- Material tables lack `sku` fields (only `name` fields exist)
- Adding `sku` to material tables would require massive data migration
- Abbreviation logic is deterministic and consistent
- Can always regenerate from material names

**Implementation**:
```typescript
// "Navy Blue" → "NAV"
// "White Oak Natural Finish" → "OAK"
// "Brushed Nickel" → "BRN"
function abbreviateMaterial(materialName: string, type: string): string {
  // Remove common words
  const cleaned = materialName
    .replace(/finish|type|color|material/gi, '')
    .trim();

  // Take first 3-4 letters of meaningful words
  const abbr = cleaned.split(' ')
    .map(word => word.substring(0, 3).toUpperCase())
    .join('');

  return `${type.toUpperCase()}-${abbr}`;
}
```

**Alternative Considered**: Add `sku` fields to all material tables
**Rejected Because**: Too invasive, requires data migration, not currently needed

---

### **3. Sales Analytics Aggregation Strategy**

**Decision**: Query by `order_items.item_id` foreign key (not SKU pattern matching)

**Rationale**:
- ✅ More reliable (database-enforced foreign key)
- ✅ Faster (indexed field)
- ✅ Handles catalog item updates (ID never changes, SKU might)
- ✅ Simpler SQL (no LIKE patterns)

**Alternative Considered**: `WHERE full_sku LIKE 'BASE-SKU%'`
**Kept as Secondary Option**: Still useful for cross-catalog analysis

---

### **4. Defer BOM and Reviews Tabs**

**Decision**: Do NOT implement BOM or Reviews tabs in initial version

**Rationale**:
- **BOM (Bill of Materials)**: Complex material costing system, requires extensive planning
- **Reviews**: Review collection and moderation system not yet designed
- **Focus**: Ship core functionality first (Overview, Sales, Docs, QC)
- **Future**: Add BOM and Reviews as Phase 3 enhancements

---

### **5. Document Storage Hybrid Approach**

**Decision**: Reuse Design Module's Google Drive integration

**Rationale**:
- ✅ OAuth already configured and working
- ✅ Large CAD files (>50MB) need Google Drive capacity
- ✅ Supabase has 50MB upload limit
- ✅ Proven working system from Design module
- ✅ No reinvention needed

**Storage Routing**:
- File < 50MB → Supabase Storage
- File ≥ 50MB → Google Drive
- CAD files (.dwg, .dxf, .3dm) → Always Google Drive (typically large)
- PDFs, images → Supabase (typically small)

---

## 📋 OPEN QUESTIONS & RISKS

### **Open Questions**

1. **Date Range Default**: What should be the default date range for sales trends?
   - **Recommendation**: Last 30 days (good balance of detail vs performance)

2. **QC Inspection Limit**: Show last 5 or last 10 inspections?
   - **Recommendation**: Last 5 (matches industry standard)

3. **Material Combo Display**: Show top 5 or top 10?
   - **Recommendation**: Top 10 (more insights for analytics)

4. **Authentication**: Should Overview tab be public or require login?
   - **Recommendation**: Public (allows catalog browsing), other tabs require auth

5. **Empty States**: What should empty states show when no data?
   - **Recommendation**: Friendly message + "Add First Order" CTA

---

### **Risks & Mitigations**

**Risk 1: Large JSON Parsing for Material Combos**
- **Impact**: Performance degradation with 1000+ orders
- **Mitigation**: Add limit parameter, paginate results, consider PostgreSQL JSON aggregation

**Risk 2: Google Drive OAuth Token Expiry**
- **Impact**: Document uploads fail after token expires
- **Mitigation**: Reuse Design module's refresh token logic, test token renewal

**Risk 3: Full SKU Generation Conflicts**
- **Impact**: Two orders with same materials generate duplicate Full SKUs
- **Mitigation**: Full SKU is NOT unique (can have duplicates), only `id` is primary key

**Risk 4: Material Name Changes Breaking SKU Logic**
- **Impact**: Old orders show wrong Full SKU if material names change
- **Mitigation**: Full SKU is STORED (not derived), preserves historical accuracy

---

## ✅ IMPLEMENTATION READINESS

### **Green Lights** (Ready to Implement)

✅ Database schema understood completely
✅ Existing components identified for reuse
✅ API router patterns established
✅ Material specification JSON structure defined
✅ Full SKU generation logic designed
✅ Storage system (hybrid) already working
✅ Authentication system in place
✅ Global CSS architecture established

### **Yellow Lights** (Need Attention)

⚠️ Material abbreviation logic needs comprehensive testing
⚠️ JSON parsing performance with large datasets needs monitoring
⚠️ QC inspection linkage needs verification (order_items → qc_inspections)
⚠️ Date range selector needs UX validation

### **Red Lights** (Blockers)

❌ None identified - all dependencies resolved

---

## 📚 RELATED DOCUMENTATION

- [Full SKU Architecture](./FULL_SKU_ARCHITECTURE.md)
- [Specifications JSON Schema](./SPECIFICATIONS_JSON_SCHEMA.md)
- [Implementation Plan](./CATALOG_ITEM_DETAIL_IMPLEMENTATION_PLAN.md)

---

**Research Completed**: October 2, 2025
**Status**: ✅ READY FOR IMPLEMENTATION
**Next Phase**: Database Schema Update (add `full_sku` field)
