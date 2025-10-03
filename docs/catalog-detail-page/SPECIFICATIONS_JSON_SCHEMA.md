# Material Specifications JSON Schema

**Created**: October 2, 2025
**System**: Product Configuration
**Storage**: `order_items.specifications` (JSON field)

---

## 🎯 PURPOSE

The `specifications` JSON field stores complete material selections and customizations chosen by the client when ordering a catalog item. This data is used for:

- **Manufacturing**: Exact material specifications for production
- **Full SKU Generation**: Creating unique product SKU
- **Sales Analytics**: Material preference trending
- **Invoicing**: Detailed line item breakdown
- **Quality Control**: Verification of correct materials used

---

## 📊 INDUSTRY-STANDARD SCHEMA

### **Complete Structure**

```json
{
  "materials": {
    "fabric": {
      "type": "upholstery",
      "brand": "Maharam",
      "brand_id": "uuid-here",
      "collection": "Divina",
      "collection_id": "uuid-here",
      "color": "Navy",
      "color_id": "uuid-here",
      "color_code": "DIV-540",
      "grade": "COM",
      "sku": "MAH-DIV-540",
      "price_modifier": 150.00
    },
    "wood": {
      "type": "frame",
      "species": "White Oak",
      "species_id": "uuid-here",
      "finish": "Natural",
      "finish_id": "uuid-here",
      "finish_code": "OAK-NAT",
      "sku": "WOD-OAK-NAT",
      "price_modifier": 50.00
    },
    "metal": {
      "type": "legs",
      "material": "Steel",
      "material_id": "uuid-here",
      "finish": "Brushed Nickel",
      "finish_id": "uuid-here",
      "finish_code": "BRN",
      "sku": "MET-STL-BRN",
      "price_modifier": 25.00
    },
    "stone": {
      "type": "top",
      "material": "Marble",
      "material_id": "uuid-here",
      "finish": "Polished",
      "finish_id": "uuid-here",
      "color": "Carrara White",
      "sku": "STO-MAR-WHI",
      "price_modifier": 300.00
    },
    "weaving": {
      "material": "Cane",
      "material_id": "uuid-here",
      "pattern": "Closed Weave",
      "pattern_id": "uuid-here",
      "color": "Natural",
      "sku": "WEV-CAN-NAT",
      "price_modifier": 75.00
    },
    "carving": {
      "style": "Traditional",
      "style_id": "uuid-here",
      "pattern": "Floral",
      "pattern_id": "uuid-here",
      "depth": "Medium Relief",
      "sku": "CAR-TRA-FLO",
      "price_modifier": 200.00
    }
  },
  "customizations": {
    "nailhead_trim": {
      "enabled": true,
      "type": "Individual",
      "finish": "Antique Brass",
      "spacing": "1 inch",
      "price": 50.00
    },
    "contrast_welting": {
      "enabled": false
    },
    "monogram": {
      "enabled": true,
      "text": "ABC",
      "location": "center_back",
      "font": "Script",
      "color": "Gold Thread",
      "price": 75.00
    },
    "custom_dimensions": {
      "enabled": false
    },
    "special_requests": "Please ensure tight upholstery. Client prefers firm cushions."
  },
  "pricing": {
    "base_price": 1200.00,
    "material_upcharges": {
      "fabric": 150.00,
      "wood": 50.00,
      "metal": 25.00,
      "stone": 300.00,
      "weaving": 75.00,
      "carving": 200.00
    },
    "customization_fees": {
      "nailhead_trim": 50.00,
      "monogram": 75.00
    },
    "subtotal": 2175.00,
    "discount": 0.00,
    "tax": 0.00,
    "total_price": 2175.00,
    "currency": "USD"
  },
  "metadata": {
    "configured_at": "2025-10-02T10:30:00Z",
    "configured_by_user_id": "uuid-here",
    "sales_rep_id": "uuid-here",
    "notes": "Client requested rush delivery if possible"
  }
}
```

---

## 🏗️ SCHEMA BREAKDOWN

### **1. materials** (object)

**Purpose**: Complete material selections for all product components

**Structure**: Hierarchical by material type

**Material Types**:
- `fabric` - Upholstery fabrics, cushions
- `wood` - Frame, legs, trim
- `metal` - Hardware, legs, accents
- `stone` - Tops, inlays
- `weaving` - Cane, rope, rattan weaving
- `carving` - Decorative wood carving

**Common Fields** (for each material):
- `type` (string) - Usage location (e.g., "upholstery", "frame", "legs")
- `*_id` (uuid) - Database FK to material tables
- `sku` (string) - Material SKU component
- `price_modifier` (decimal) - Upcharge amount

### **2. customizations** (object)

**Purpose**: Optional add-ons and special features

**Common Patterns**:
```json
{
  "feature_name": {
    "enabled": boolean,
    // ... feature-specific fields
    "price": decimal
  }
}
```

**Standard Customizations**:
- `nailhead_trim` - Decorative nail head trim
- `contrast_welting` - Contrasting piping/welting
- `monogram` - Embroidered monogram
- `custom_dimensions` - Non-standard sizing
- `special_requests` - Free-form text

### **3. pricing** (object)

**Purpose**: Complete price breakdown for transparency

**Fields**:
- `base_price` - Catalog item list price
- `material_upcharges` - Breakdown by material type
- `customization_fees` - Breakdown by feature
- `subtotal` - Sum of all charges
- `discount` - Any applied discounts
- `tax` - Sales tax (if applicable)
- `total_price` - Final order item price
- `currency` - ISO currency code (default: USD)

**Calculation**:
```
total_price = base_price
            + sum(material_upcharges)
            + sum(customization_fees)
            - discount
            + tax
```

### **4. metadata** (object)

**Purpose**: Audit trail and contextual information

**Fields**:
- `configured_at` - ISO timestamp of configuration
- `configured_by_user_id` - User who configured (UUID)
- `sales_rep_id` - Sales representative (UUID)
- `notes` - Internal notes about configuration

---

## 💡 USAGE EXAMPLES

### **Example 1: Simple Chair (Fabric + Wood Only)**

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
    "wood": {
      "type": "frame",
      "species": "White Oak",
      "finish": "Natural",
      "sku": "WOD-OAK-NAT",
      "price_modifier": 50.00
    }
  },
  "customizations": {},
  "pricing": {
    "base_price": 1200.00,
    "material_upcharges": {
      "fabric": 150.00,
      "wood": 50.00
    },
    "customization_fees": {},
    "subtotal": 1400.00,
    "total_price": 1400.00,
    "currency": "USD"
  }
}
```

**Generated Full SKU**: `CC-CHA-001-FAB-NAV-WOD-OAK`

---

### **Example 2: Complex Sofa (Multiple Materials + Customizations)**

```json
{
  "materials": {
    "fabric": {
      "type": "upholstery",
      "brand": "Maharam",
      "collection": "Divina",
      "color": "Charcoal",
      "sku": "MAH-DIV-170",
      "price_modifier": 200.00
    },
    "wood": {
      "type": "frame",
      "species": "Walnut",
      "finish": "Dark Espresso",
      "sku": "WOD-WAL-ESP",
      "price_modifier": 150.00
    },
    "metal": {
      "type": "legs",
      "material": "Steel",
      "finish": "Matte Black",
      "sku": "MET-STL-BLK",
      "price_modifier": 75.00
    }
  },
  "customizations": {
    "nailhead_trim": {
      "enabled": true,
      "type": "Individual",
      "finish": "Antique Brass",
      "spacing": "1 inch",
      "price": 100.00
    },
    "contrast_welting": {
      "enabled": true,
      "fabric_color": "Navy",
      "price": 50.00
    }
  },
  "pricing": {
    "base_price": 3500.00,
    "material_upcharges": {
      "fabric": 200.00,
      "wood": 150.00,
      "metal": 75.00
    },
    "customization_fees": {
      "nailhead_trim": 100.00,
      "contrast_welting": 50.00
    },
    "subtotal": 4075.00,
    "total_price": 4075.00,
    "currency": "USD"
  }
}
```

**Generated Full SKU**: `IN-SOFA-001-FAB-CHAR-WOD-WAL-MET-BLK`

---

## 🔍 QUERYING SPECIFICATIONS

### **PostgreSQL JSON Queries**

**Find orders with specific fabric brand:**
```sql
SELECT *
FROM order_items
WHERE specifications->'materials'->'fabric'->>'brand' = 'Maharam';
```

**Find orders with Navy fabric:**
```sql
SELECT *
FROM order_items
WHERE specifications->'materials'->'fabric'->>'color' = 'Navy';
```

**Find orders with nailhead trim:**
```sql
SELECT *
FROM order_items
WHERE specifications->'customizations'->'nailhead_trim'->>'enabled' = 'true';
```

**Aggregate material combinations:**
```sql
SELECT
  specifications->'materials'->'fabric'->>'color' as fabric_color,
  COUNT(*) as order_count
FROM order_items
WHERE item_id = 'catalog-item-uuid'
GROUP BY fabric_color
ORDER BY order_count DESC;
```

---

## 📈 ANALYTICS USE CASES

### **1. Most Popular Material Combinations**

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

// Result:
// {
//   '{"fabric":"Navy","wood":"Oak","metal":"Brushed Nickel"}': 45,
//   '{"fabric":"Charcoal","wood":"Walnut","metal":"Matte Black"}': 30
// }
```

### **2. Material Preference Trends**

```typescript
// Extract individual material popularity
const fabricCounts = orderItems
  .filter(item => item.specifications.materials.fabric)
  .map(item => item.specifications.materials.fabric.color)
  .reduce((acc, color) => {
    acc[color] = (acc[color] || 0) + 1;
    return acc;
  }, {});

// Result: { "Navy": 45, "Charcoal": 30, "Beige": 20 }
```

### **3. Average Upcharge by Material**

```typescript
const avgFabricUpcharge = orderItems
  .filter(item => item.specifications.materials.fabric)
  .reduce((sum, item) => {
    return sum + (item.specifications.materials.fabric.price_modifier || 0);
  }, 0) / orderItems.length;

// Result: $162.50 average fabric upcharge
```

---

## 🎯 BEST PRACTICES

### **DO**
✅ **Store UUIDs** for all material selections (enables catalog updates)
✅ **Include SKU components** for Full SKU generation
✅ **Track price modifiers** for transparent pricing
✅ **Timestamp configurations** for audit trail
✅ **Validate JSON structure** before saving
✅ **Use hierarchical structure** for easy querying

### **DON'T**
❌ **Store only names** (without IDs) - loses database linkage
❌ **Omit pricing breakdown** - reduces transparency
❌ **Use flat structure** - harder to query and extend
❌ **Hardcode material types** - prevents future expansion
❌ **Skip validation** - allows malformed data

---

## 🔄 SCHEMA VERSIONING

**Current Version**: `1.0`

**Future Enhancements**:
- Add `schema_version` field to specifications
- Support backward-compatible migrations
- Version-specific parsing logic

**Example**:
```json
{
  "schema_version": "1.0",
  "materials": { ... },
  // ... rest of spec
}
```

---

## 📚 RELATED FILES

- **Order Items Router**: `/src/server/api/routers/order-items.ts`
- **Full SKU Generator**: `/src/lib/utils/full-sku-generator.ts`
- **Material Models**: Prisma schema (`fabric_colors`, `wood_finishes`, etc.)

---

**Last Updated**: October 2, 2025
**Schema Version**: 1.0
