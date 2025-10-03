# Catalog Item Detail Page - Implementation Plan

**Created**: October 2, 2025
**Status**: ✅ IMPLEMENTED
**Module**: Products / Catalog

---

## 🎯 OBJECTIVE

Build a comprehensive catalog item detail page with 4-tab interface for viewing product specifications, sales analytics, documents, and quality/QC data.

---

## 📋 FEATURES IMPLEMENTED

### **4-Tab Structure**

1. **Overview Tab**
   - Product image carousel (from `item_images` table)
   - Complete specifications table
   - Furniture dimensions display (dual units: inches + cm)
   - Base SKU with explanation
   - Collection link (clickable to collection detail page)
   - List price (base price before material upcharges)
   - Status badges (Production Ready, Active, etc.)

2. **Sales Analytics Tab**
   - Summary statistics cards:
     - Total Units Sold (all orders for this item)
     - Total Revenue
     - Average Order Value
     - Number of Orders
   - Most Popular Material Combinations
     - Parse `specifications` JSON from order_items
     - Group by material combo
     - Show top 5-10 with counts and percentages
   - Order History Table
     - Order number, client, quantity, full_sku, materials, date, total
     - Sortable and filterable
   - Sales Trend Chart (recharts)
     - Last 30/60/90 days toggle
     - Custom date range picker

3. **Documents Tab**
   - Document library (CAD files, 3D models, certifications, assembly PDFs)
   - Storage type badges (Supabase vs Google Drive)
   - Document type filter
   - File search
   - **Full CRUD Operations**:
     - Upload (drag-and-drop, hybrid storage routing)
     - Download
     - Delete (with confirmation)
     - Edit metadata

4. **Quality & QC Tab**
   - Summary Statistics Cards:
     - Total QC inspections
     - Pass rate (%)
     - Average defects per inspection
     - Last inspection date
   - Recent QC Inspections Table (last 5)
     - Date, stage, status, defects count, inspector, notes
     - Link to full QC detail page (`/production/qc/[id]`)
   - Defect Rate Trend Chart

---

## 🗄️ DATABASE SCHEMA CHANGES

### **Added `full_sku` field to `order_items` table**

```prisma
model order_items {
  id                   String                 @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  order_id             String?                @db.Uuid
  item_id              String?                @db.Uuid
  full_sku             String?                @db.VarChar(200)  // NEW FIELD
  quantity             Int?                   @default(1)
  unit_price           Decimal?               @db.Decimal(10, 2)
  project_sku          String?
  description          String?
  specifications       Json?
  // ... other fields
}
```

**Purpose**: Store permanent Full SKU (e.g., `CC-CHA-001-FAB-NAV-WOD-OAK`) generated at order item creation time.

---

## 🔧 FULL SKU SYSTEM

### **What is Full SKU?**

- **Base SKU**: Catalog item identifier (e.g., `CC-CHA-001`)
  - Format: `{COLLECTION_PREFIX}-{ITEM_NAME_ABBR}-{SEQ}`
  - Stored in: `items.base_sku`

- **Full SKU**: Complete product specification with materials (e.g., `CC-CHA-001-FAB-NAV-WOD-OAK-MET-BRN`)
  - Format: `{BASE_SKU}-{FAB}-{WOOD}-{METAL}-...`
  - Stored in: `order_items.full_sku`
  - Generated: When sales rep creates order and selects materials

### **When/Where Generated**

1. **Trigger**: Sales rep creates order item with material selections
2. **Location**: `/src/server/api/routers/order-items.ts` - `create` mutation
3. **Process**:
   - Fetch catalog item's `base_sku`
   - Parse material selections from form
   - Generate Full SKU using utility function
   - Store in `order_items.full_sku` field

### **Why Store It?**

✅ **Permanent Record**: SKU never changes even if catalog updates
✅ **Performance**: No need to reconstruct from JSON every query
✅ **Sales Analytics**: Easy to query `WHERE full_sku LIKE 'CC-CHA-001%'`
✅ **Client Communication**: SKU printed on invoices, labels, documents
✅ **Historical Accuracy**: Material name changes don't affect old orders

---

## 📊 MATERIAL SPECIFICATIONS JSON

### **Industry-Standard Structure**

```json
{
  "materials": {
    "fabric": {
      "type": "upholstery",
      "brand": "Maharam",
      "collection": "Divina",
      "color": "Navy",
      "color_code": "DIV-540",
      "grade": "COM",
      "sku": "MAH-DIV-540"
    },
    "wood": {
      "type": "frame",
      "species": "Oak",
      "finish": "Natural",
      "finish_code": "OAK-NAT",
      "sku": "WOD-OAK-NAT"
    },
    "metal": {
      "type": "legs",
      "material": "Steel",
      "finish": "Brushed Nickel",
      "finish_code": "BRN",
      "sku": "MET-STL-BRN"
    }
  },
  "customizations": {
    "nailhead_trim": true,
    "contrast_welting": false,
    "monogram": "ABC"
  },
  "pricing": {
    "base_price": 1200.00,
    "fabric_upcharge": 150.00,
    "wood_upcharge": 50.00,
    "customization_fees": 75.00,
    "total_price": 1475.00
  }
}
```

Stored in: `order_items.specifications` JSON field

---

## 🔌 API ENDPOINTS

### **Catalog Router** (`/src/server/api/routers/catalog.ts`)

```typescript
getCatalogItemById({ id: string })
// Returns: Full item with relations (collection, dimensions, images)

getSalesAnalytics({ itemId: string, dateFrom?: Date, dateTo?: Date })
// Returns: Aggregate sales data (units, revenue, order count)

getPopularMaterials({ itemId: string, limit?: number })
// Returns: Top material combinations with counts and percentages
```

### **Storage Router** (`/src/server/api/routers/storage.ts`)

```typescript
getDocumentsByCatalogItem({ itemId: string, documentType?: string })
// Returns: All documents for catalog item, filtered by type
```

### **QC Router** (`/src/server/api/routers/qc.ts`)

```typescript
getInspectionsByCatalogItem({ itemId: string, limit?: number })
// Returns: Recent QC inspections for this catalog item
```

---

## 🎨 COMPONENT ARCHITECTURE

### **Main Page**
- `/src/app/products/catalog/[id]/page.tsx`
- Uses Next.js App Router dynamic routing
- 4-tab interface using shadcn/ui `Tabs` component

### **Tab Components**
- `/src/components/catalog/CatalogOverviewTab.tsx`
- `/src/components/catalog/CatalogSalesTab.tsx`
- `/src/components/catalog/CatalogDocumentsTab.tsx`
- `/src/components/catalog/CatalogQualityTab.tsx`

### **Reused Components**
- `DimensionDisplay` (from `/src/components/furniture/`)
- `ImageManager` (from `/src/components/furniture/`)
- `FileUploader` (from `/src/components/design/` - Design module)

---

## 🎯 TESTING CHECKLIST

### **Functional Testing**
- [ ] Page loads for valid catalog item ID
- [ ] All 4 tabs render without errors
- [ ] Overview tab shows images, specs, dimensions
- [ ] Sales analytics aggregate correctly by `item_id`
- [ ] Material combinations parse from `specifications` JSON
- [ ] Order history table displays and sorts
- [ ] Sales trend chart renders with data
- [ ] Date range selector works (predefined + custom)
- [ ] Document upload triggers hybrid storage routing
- [ ] CAD files >50MB route to Google Drive
- [ ] PDF files <50MB route to Supabase
- [ ] Document download/delete functions work
- [ ] QC inspections display correctly
- [ ] QC detail page link navigates correctly
- [ ] Collection link navigates to collection detail

### **Quality Checks**
- [ ] TypeScript: 0 errors (`npm run type-check`)
- [ ] ESLint: 0 warnings (`npm run lint`)
- [ ] Build: Success (`npm run build`)
- [ ] Security: 0 vulnerabilities (`npm run security:check`)
- [ ] Mobile responsive (test at 375px, 768px, 1280px)
- [ ] All navigation functional
- [ ] Global CSS only (no hardcoded styles)

---

## 📝 DEPLOYMENT NOTES

### **Environment Variables Required**
- `NEXT_PUBLIC_APP_URL` - For generating document URLs
- Google Drive OAuth credentials (already configured from Design module)
- Supabase credentials (already configured)

### **Database Migrations**
```bash
npx prisma db push
npx prisma generate
```

### **Post-Deployment Tasks**
1. Verify Full SKU generation works on first order item creation
2. Test document upload with large CAD file (>50MB)
3. Check sales analytics aggregation with real data
4. Verify QC inspection linking

---

## 🚀 FUTURE ENHANCEMENTS

**Deferred to Future Phases**:
- ❌ BOM (Bill of Materials) Tab - Complex material costing system
- ❌ Customer Reviews - Review collection and display system
- ⏳ Material price modifiers - Automatic upcharge calculations
- ⏳ 3D model viewer - Interactive 3D model display in browser
- ⏳ AR preview - Augmented reality product preview

---

## 📚 RELATED DOCUMENTATION

- [Full SKU Architecture](./FULL_SKU_ARCHITECTURE.md)
- [Specifications JSON Schema](./SPECIFICATIONS_JSON_SCHEMA.md)
- [Research Findings](./RESEARCH_FINDINGS.md)

---

**Last Updated**: October 2, 2025
**Implemented By**: Claude Code
**Reviewed By**: User
