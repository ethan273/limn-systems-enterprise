# Full SKU Architecture & System Design

**Created**: October 2, 2025
**System**: Product SKU Management
**Module**: Products / Catalog

---

## 🎯 OVERVIEW

The Full SKU system provides unique identification for furniture products throughout their lifecycle, from catalog item (Base SKU) to ordered product with specific material selections (Full SKU).

---

## 📊 SKU HIERARCHY

### **Level 1: Base SKU** (Catalog Level)
**Format**: `{COLLECTION_PREFIX}-{ITEM_NAME_ABBR}-{VARIATION}-{SEQ}`

**Examples**:
- `CC-CHA-001` - Coastal Collection Chair #001
- `IN-SECT-DEEP-002` - Inyo Sectional Deep #002
- `PC-LOUN-WIDE-001` - Pacifica Lounge Wide #001

**Characteristics**:
- **Stored in**: `items.base_sku` (catalog items table)
- **Uniqueness**: One Base SKU per catalog item configuration
- **Variability**: Can have multiple variations (Deep, Wide, Standard, etc.)
- **Purpose**: Identifies product design/prototype ready for production

### **Level 2: Full SKU** (Order Level)
**Format**: `{BASE_SKU}-{FAB}-{WOOD}-{METAL}-...`

**Examples**:
- `CC-CHA-001-FAB-NAV-WOD-OAK` - Chair with Navy Fabric, Oak Wood
- `CC-CHA-001-FAB-CHAR-WOD-WAL-MET-BRN` - Chair with Charcoal Fabric, Walnut Wood, Brushed Nickel Metal

**Characteristics**:
- **Stored in**: `order_items.full_sku` (order items table)
- **Uniqueness**: Can have duplicates (same combo ordered multiple times)
- **Variability**: Unlimited combinations based on material selections
- **Purpose**: Identifies exact product specification for manufacturing

### **Level 3: Project SKU** (Client Tracking)
**Format**: `{CLIENT_CODE}-{YEAR}-{PROJECT}-{ITEM_SEQ}`

**Examples**:
- `ACME-24-DEV-001.001` - Acme Development Project, Item 1
- `GOOG-24-OFF-001.002` - Google Office Project, Item 2

**Characteristics**:
- **Stored in**: `order_items.project_sku`
- **Uniqueness**: Always unique per order item
- **Purpose**: Client-facing tracking for specific orders

---

## 🔧 FULL SKU GENERATION

### **When Generated**

**Trigger Point**: Sales rep creates order item with material selections

**Location**: `/src/server/api/routers/order-items.ts` - `create` mutation

**Process Flow**:
```
1. User selects catalog item → Retrieves base_sku
2. User selects materials (fabric, wood, metal, etc.)
3. System calls generateFullSku(base_sku, specifications)
4. System stores result in order_items.full_sku
5. Full SKU displayed on invoice, labels, documents
```

### **Generation Logic**

**Utility**: `/src/lib/utils/full-sku-generator.ts`

```typescript
function generateFullSku(
  baseSku: string,
  specifications: MaterialSpecifications
): string {
  const components = [baseSku];

  // Add fabric component if selected
  if (specifications.fabric_color) {
    const fabricAbbr = abbreviateMaterial(specifications.fabric_color, 'fabric');
    components.push(fabricAbbr); // e.g., "FAB-NAV"
  }

  // Add wood component if selected
  if (specifications.wood_finish) {
    const woodAbbr = abbreviateMaterial(specifications.wood_finish, 'wood');
    components.push(woodAbbr); // e.g., "WOD-OAK"
  }

  // Add metal component if selected
  if (specifications.metal_finish) {
    const metalAbbr = abbreviateMaterial(specifications.metal_finish, 'metal');
    components.push(metalAbbr); // e.g., "MET-BRN"
  }

  return components.join('-');
}

// Result: "CC-CHA-001-FAB-NAV-WOD-OAK-MET-BRN"
```

### **Material Abbreviation Rules**

**Format**: `{TYPE_PREFIX}-{MATERIAL_ABBR}`

**Type Prefixes**:
- `FAB` - Fabric
- `WOD` - Wood
- `MET` - Metal
- `STO` - Stone
- `WEV` - Weaving
- `CAR` - Carving

**Material Abbreviation**:
1. Remove common words ("finish", "type", "color", "material")
2. Take first 3-4 letters of remaining words
3. Join and uppercase

**Examples**:
- "Navy Blue" → `NAV`
- "White Oak" → `OAK`
- "Brushed Nickel" → `BRN` (Brushed Nickel → BRushed Nickel)
- "Maharam Divina" → `MAHDIV` (special case: brand + collection)

---

## 💾 STORAGE STRATEGY

### **Why Store Full SKU (Instead of Generating On-Demand)?**

**✅ Permanent Record**
- Material names in catalog may change over time
- Old orders maintain original SKU
- Historical accuracy preserved

**✅ Performance**
- No JSON parsing on every query
- Direct SQL `WHERE full_sku LIKE 'CC-CHA-001%'`
- Faster sales analytics aggregation

**✅ Client Communication**
- SKU printed on invoices
- SKU on shipping labels
- SKU in client portals
- Consistent across all documents

**✅ Manufacturing Efficiency**
- Production orders grouped by Full SKU
- "Make 10x CC-CHA-001-FAB-NAV-WOD-OAK"
- Clear material specifications

### **Database Schema**

```prisma
model order_items {
  id           String   @id @default(uuid()) @db.Uuid
  order_id     String   @db.Uuid
  item_id      String   @db.Uuid  // Links to catalog item (base_sku)
  full_sku     String   @db.VarChar(200)  // STORED HERE
  project_sku  String?  // Client tracking

  specifications  Json   // Original material selections
  quantity        Int
  unit_price      Decimal

  // Relations
  items  items  @relation(fields: [item_id], references: [id])
  orders orders @relation(fields: [order_id], references: [id])
}
```

---

## 📈 SALES ANALYTICS USAGE

### **Aggregate Sales by Base SKU**

**Query**: Find all orders for a catalog item regardless of material selections

```sql
SELECT
  COUNT(*) as total_orders,
  SUM(quantity) as total_units,
  SUM(quantity * unit_price) as total_revenue,
  AVG(unit_price) as avg_price
FROM order_items
WHERE item_id = 'catalog-item-uuid'
-- OR: WHERE full_sku LIKE 'CC-CHA-001%'
```

### **Most Popular Material Combinations**

**Query**: Group by Full SKU to find popular configurations

```sql
SELECT
  full_sku,
  COUNT(*) as order_count,
  SUM(quantity) as total_units,
  specifications
FROM order_items
WHERE item_id = 'catalog-item-uuid'
GROUP BY full_sku, specifications
ORDER BY order_count DESC
LIMIT 10
```

**Result**:
```
full_sku                                 | order_count | total_units
-----------------------------------------|-------------|------------
CC-CHA-001-FAB-NAV-WOD-OAK              | 45          | 180
CC-CHA-001-FAB-CHAR-WOD-WAL             | 30          | 95
CC-CHA-001-FAB-BEIG-WOD-MAP             | 20          | 60
```

### **Material Preference Analysis**

**Parse specifications JSON** to understand material trends:

```typescript
// From order_items.specifications JSON
const materialCounts = {
  "Navy Fabric": 45,
  "Charcoal Fabric": 30,
  "Beige Fabric": 20,
  "Oak Wood": 55,
  "Walnut Wood": 40,
};

// Calculate percentages
const total = 95;
const percentages = {
  "Navy Fabric": "47%",
  "Charcoal Fabric": "32%",
  "Beige Fabric": "21%",
};
```

---

## 🔄 LIFECYCLE EXAMPLE

### **From Design to Delivery**

**1. Design Phase**
- Designer creates product concept
- Product added to catalog as **Prototype**
- No SKU yet

**2. Approval Phase**
- Prototype approved for production
- Status changed to **Production Ready**
- **Base SKU generated**: `CC-CHA-001`
- Stored in `items.base_sku`

**3. Sales Phase**
- Client browses catalog, sees Base SKU `CC-CHA-001`
- Sales rep creates quote/order
- Client selects materials:
  - Fabric: Navy
  - Wood: Oak
  - Metal: Brushed Nickel

**4. Order Creation**
- System generates **Full SKU**: `CC-CHA-001-FAB-NAV-WOD-OAK-MET-BRN`
- Stored in `order_items.full_sku`
- **Project SKU generated**: `ACME-24-DEV-001.001`
- Invoice shows: "Executive Chair (CC-CHA-001-FAB-NAV-WOD-OAK-MET-BRN)"

**5. Manufacturing**
- Production order created
- Full SKU tells factory exact materials
- "Make 10x CC-CHA-001-FAB-NAV-WOD-OAK-MET-BRN"
- BOM generated from Full SKU materials

**6. QC & Shipping**
- QC inspection references Full SKU
- Shipping label shows Full SKU + Project SKU
- Client tracking uses Project SKU

**7. Analytics**
- Sales report: "CC-CHA-001 sold 95 units"
- Popular combo: "Navy + Oak (45 orders, 47%)"
- Material trends: "Navy fabric most popular"

---

## 🎯 BENEFITS OF THIS ARCHITECTURE

### **For Sales Team**
- ✅ Simple Base SKU for catalog browsing
- ✅ Clear Full SKU on quotes and invoices
- ✅ Easy material selection process

### **For Manufacturing**
- ✅ Exact material specifications in SKU
- ✅ Group orders by Full SKU for efficiency
- ✅ No ambiguity in BOM

### **For Clients**
- ✅ Project SKU for their tracking
- ✅ Full SKU on invoices (if needed)
- ✅ Clear material documentation

### **For Analytics**
- ✅ Easy aggregation by Base SKU
- ✅ Material trend analysis
- ✅ Pricing insights

---

## 🚨 IMPORTANT NOTES

### **DO NOT**
- ❌ Modify Full SKU after order creation
- ❌ Use Full SKU as primary key (use UUID `id`)
- ❌ Generate Full SKU for catalog items (only order items)
- ❌ Allow duplicate Base SKUs in catalog

### **DO**
- ✅ Always generate Full SKU at order item creation
- ✅ Store Full SKU permanently in database
- ✅ Use Base SKU for catalog item identification
- ✅ Use Project SKU for client communication
- ✅ Query by `item_id` for analytics (more reliable than SKU pattern matching)

---

## 📚 RELATED FILES

- **Generation Utility**: `/src/lib/utils/full-sku-generator.ts`
- **Base SKU Generator**: `/src/lib/utils/base-sku-generator.ts`
- **Order Items Router**: `/src/server/api/routers/order-items.ts`
- **Catalog Router**: `/src/server/api/routers/catalog.ts`

---

**Last Updated**: October 2, 2025
**Maintained By**: Engineering Team
