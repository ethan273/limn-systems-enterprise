# Form Creation Bug Fix & Dimensions Implementation Plan

## Bug Summary

**Issue**: Add Concept/Prototype/Catalog Item buttons navigate to non-existent `/new` routes
**Impact**: Users cannot create new products
**Root Cause**: Pages incorrectly use `router.push('/products/*/new')` instead of FormDialog pattern

---

## Affected Files

### 1. `/src/app/products/concepts/page.tsx`
**Lines**: 206, 224
**Current Code**:
```typescript
onClick: () => router.push('/products/concepts/new')
```

### 2. `/src/app/products/prototypes/page.tsx`
**Lines**: 206, 224
**Current Code**:
```typescript
onClick: () => router.push('/products/prototypes/new')
```

### 3. `/src/app/products/catalog/page.tsx`
**Lines**: 236, 254
**Current Code**:
```typescript
onClick: () => router.push('/products/catalog/new')
```

---

## Solution: Use FormDialog Pattern

### Reference Implementation
**File**: `/src/app/products/materials/page.tsx` (Line 737)
Uses FormDialog correctly for inline creation

---

## Implementation Steps

### Step 1: Fix Concepts Page

**File**: `/src/app/products/concepts/page.tsx`

1. **Add State**:
```typescript
const [isFormOpen, setIsFormOpen] = useState(false);
```

2. **Replace Navigation with State Toggle**:
```typescript
// BEFORE (Lines 206, 224):
onClick: () => router.push('/products/concepts/new')

// AFTER:
onClick: () => setIsFormOpen(true)
```

3. **Add FormDialog Component**:
```typescript
<FormDialog
  open={isFormOpen}
  onOpenChange={setIsFormOpen}
  title="Create New Concept"
  description="Add a new furniture concept to the system"
  fields={[
    { name: 'name', label: 'Concept Name', type: 'text', required: true },
    { name: 'concept_number', label: 'Concept Number', type: 'text' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'designer_id', label: 'Designer', type: 'text' }, // TODO: Make this a select
    { name: 'collection_id', label: 'Collection', type: 'text' }, // TODO: Make this a select
    { name: 'status', label: 'Status', type: 'text' },
    { name: 'priority', label: 'Priority', type: 'text' },
    { name: 'target_price', label: 'Target Price', type: 'number' },
    { name: 'estimated_cost', label: 'Estimated Cost', type: 'number' },
  ]}
  onSubmit={async (data) => {
    await createMutation.mutateAsync(data);
    setIsFormOpen(false);
  }}
/>
```

4. **Add Mutation**:
```typescript
const createMutation = api.products.createConcept.useMutation({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
  },
});
```

---

### Step 2: Fix Prototypes Page

**File**: `/src/app/products/prototypes/page.tsx`

Same pattern as concepts, with prototype-specific fields:

```typescript
fields={[
  { name: 'name', label: 'Prototype Name', type: 'text', required: true },
  { name: 'prototype_number', label: 'Prototype Number', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'prototype_type', label: 'Prototype Type', type: 'text' },
  { name: 'designer_id', label: 'Designer', type: 'text' },
  { name: 'manufacturer_id', label: 'Manufacturer', type: 'text' },
  { name: 'collection_id', label: 'Collection', type: 'text' },
  { name: 'concept_id', label: 'Related Concept', type: 'text' },
  { name: 'status', label: 'Status', type: 'text' },
  { name: 'priority', label: 'Priority', type: 'text' },
  { name: 'target_price_usd', label: 'Target Price (USD)', type: 'number' },
  { name: 'target_cost_usd', label: 'Target Cost (USD)', type: 'number' },
]}
```

---

### Step 3: Fix Catalog Page

**File**: `/src/app/products/catalog/page.tsx`

Catalog items require **furniture type selection** which determines available dimension fields:

```typescript
// Add additional state for furniture type
const [selectedFurnitureType, setSelectedFurnitureType] = useState<FurnitureType | null>(null);

fields={[
  { name: 'sku', label: 'SKU', type: 'text', required: true },
  { name: 'name', label: 'Item Name', type: 'text', required: true },
  { name: 'collection_id', label: 'Collection', type: 'text', required: true },
  { name: 'furniture_type', label: 'Furniture Type', type: 'select', required: true, options: [
    { value: 'chair', label: 'Chair' },
    { value: 'bench', label: 'Bench' },
    { value: 'table', label: 'Table' },
    { value: 'sofa/loveseat', label: 'Sofa/Loveseat' },
    { value: 'sectional', label: 'Sectional' },
    { value: 'lounge', label: 'Lounge Chair' },
    { value: 'chaise_lounge', label: 'Chaise Lounge' },
    { name: 'ottoman', label: 'Ottoman' },
  ]},
  { name: 'category', label: 'Category', type: 'text' },
  { name: 'subcategory', label: 'Subcategory', type: 'text' },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'list_price', label: 'List Price', type: 'number', required: true },
  { name: 'currency', label: 'Currency', type: 'text', defaultValue: 'USD' },
  { name: 'lead_time_days', label: 'Lead Time (Days)', type: 'number' },
  { name: 'min_order_quantity', label: 'Min Order Qty', type: 'number', defaultValue: 1 },
  { name: 'is_customizable', label: 'Customizable?', type: 'checkbox', defaultValue: false },
  { name: 'type', label: 'Item Type', type: 'select', options: [
    { value: 'Production Ready', label: 'Production Ready' },
    { value: 'Prototype', label: 'Prototype' },
    { value: 'Concept', label: 'Concept' },
  ], defaultValue: 'Production Ready' },
]}
```

---

## Furniture-Type-Specific Dimensions Implementation

### Overview
Use the existing `FurnitureDimensionsForm` component which already handles:
- ✅ Furniture type selection
- ✅ Dynamic field showing/hiding based on type
- ✅ Required vs optional fields per type
- ✅ Dual-unit entry (inches + cm with automatic conversion)
- ✅ Validation rules and relationships
- ✅ Grouped dimension display

### Component Location
`/src/components/furniture/FurnitureDimensionsForm.tsx`

### Validation Logic
`/src/lib/utils/dimension-validation.ts`
- Contains `FURNITURE_DIMENSION_RULES` with required/optional fields per type
- `validateFurnitureDimensions()` function
- `getDimensionGroups()` for UI organization

---

## Furniture Type Dimension Requirements

### Table
**Required**: height_inches, length_inches, width_inches
**Optional**: apron_height_inches, leg_clearance_inches, overhang_inches, leaf_width_inches, leaf_length_inches, table_top_thickness_inches, leg_height_inches

### Chair
**Required**: height_inches, width_inches, depth_inches, seat_height_inches
**Optional**: seat_width_inches, seat_depth_inches, arm_height_inches, backrest_height_inches, width_across_arms_inches

### Bench
**Required**: height_inches, length_inches, depth_inches
**Optional**: seat_height_inches, backrest_height_inches, weight_capacity

### Sofa/Loveseat
**Required**: height_inches, width_inches, depth_inches, seat_height_inches
**Optional**: seat_depth_inches, arm_height_inches, backrest_height_inches, cushion_thickness_compressed_inches, cushion_thickness_uncompressed_inches

### Sectional
**Required**: height_inches, width_inches, depth_inches
**Optional**: seat_height_inches, overall_assembled_width_inches, overall_assembled_depth_inches, corner_width_inches, corner_depth_inches, chaise_length_inches

### Lounge Chair
**Required**: height_inches, width_inches, depth_inches, seat_height_inches
**Optional**: reclined_depth_inches, footrest_length_inches, zero_wall_clearance_inches, swivel_range, rock_glide_depth_inches

### Chaise Lounge
**Required**: height_inches, width_inches, depth_inches, seat_height_inches
**Optional**: backrest_height_inches, backrest_angle, adjustable_positions, cushion_thickness_compressed_inches

### Ottoman
**Required**: ottoman_height_inches, ottoman_length_inches, ottoman_width_inches
**Optional**: weight_capacity

---

## Integration Points

### 1. Detail Pages - Add Dimensions Tab

**Files to Update**:
- `/src/app/products/concepts/[id]/page.tsx`
- `/src/app/products/prototypes/[id]/page.tsx`
- `/src/app/products/catalog/[id]/page.tsx`

**Implementation**:
```typescript
<TabsContent value="dimensions">
  <FurnitureDimensionsForm
    itemId={id}
    initialFurnitureType={item.furniture_type}
    initialDimensions={item.furniture_dimensions}
    onSave={async (data) => {
      await updateDimensionsMutation.mutateAsync({
        item_id: id,
        furniture_type: data.furniture_type,
        ...data.dimensions
      });
    }}
  />
</TabsContent>
```

### 2. Create Forms - Include Dimensions

When creating a new catalog item, after the initial form is submitted:
1. Save the basic item data
2. Redirect to detail page
3. Show "Add Dimensions" prompt
4. User fills in FurnitureDimensionsForm
5. Dimensions saved via `api.items.updateFurnitureDimensions`

**Alternative**: Use multi-step form:
- Step 1: Basic item info
- Step 2: Furniture-type-specific dimensions (conditional on furniture_type selection)

---

## API Endpoints Already Available

### Catalog Router (`/src/server/api/routers/catalog.ts`)

**Update Dimensions**:
```typescript
updateFurnitureDimensions: publicProcedure
  .input(furnitureDimensionsSchema)
  .mutation(async ({ ctx, input }) => {
    // Validates dimensions for the furniture type
    // Upserts furniture_dimensions table
  })
```

**Get Dimensions**:
```typescript
getFurnitureDimensions: publicProcedure
  .input(z.object({ itemId: z.string().uuid() }))
  .query(async ({ ctx, input }) => {
    return ctx.db.furniture_dimensions.findUnique({
      where: { item_id: input.itemId },
    });
  })
```

---

## Testing Checklist

### After Implementing Fixes:

- [ ] Concepts page "Add Concept" button opens FormDialog
- [ ] Prototypes page "Add Prototype" button opens FormDialog
- [ ] Catalog page "Add Catalog Item" button opens FormDialog
- [ ] All forms submit successfully
- [ ] Newly created items appear in the list
- [ ] Detail pages load correctly for new items
- [ ] Dimensions tab appears on detail pages
- [ ] Furniture type selection shows correct dimension fields
- [ ] Required dimensions are validated
- [ ] Dual-unit conversion works (inches ↔ cm)
- [ ] Dimension save/update works correctly

---

## Priority Order

1. **High**: Fix the three form creation bugs (concepts, prototypes, catalog)
2. **High**: Add Dimensions tab to catalog item detail pages
3. **Medium**: Add Dimensions tab to prototypes detail pages
4. **Medium**: Add Dimensions tab to concepts detail pages
5. **Low**: Implement multi-step creation with dimensions in initial form

---

## Notes

- The `FurnitureDimensionsForm` component is fully functional and tested
- All dimension validation logic exists in `/src/lib/utils/dimension-validation.ts`
- Database schema supports all dimension fields (checked in `/src/server/api/routers/catalog.ts` lines 91-181)
- Dual-unit conversion utilities exist in `/src/lib/utils/unit-conversion.ts`
- The `DimensionDisplay` component exists for read-only dimension viewing

---

**Next Action**: Start with fixing the three form creation bugs, then add dimensions tabs to detail pages.
