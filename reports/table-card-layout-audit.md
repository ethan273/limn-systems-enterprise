# Table & Card Layout Audit

**Date**: 2025-10-04
**Pages Tested**: 13
**Issues Found**: 0

## Issues by Page

✅ No layout issues detected!

### /crm/contacts
✅ No issues

### /crm/leads
✅ No issues

### /crm/customers
✅ No issues

### /crm/prospects
✅ No issues

### /tasks
✅ No issues

### /tasks/my
✅ No issues

### /financials/invoices
✅ No issues

### /financials/payments
✅ No issues

### /production/orders
✅ No issues

### /production/ordered-items
✅ No issues

### /products/catalog
✅ No issues

### /shipping/shipments
✅ No issues

### /documents
✅ No issues


## Common Patterns Causing Vertical Stacking

### 1. Table Cells with flex-col
```tsx
// ❌ WRONG - Causes vertical stacking
<td className="flex flex-col">
  <span>Label</span>
  <span>Value</span>
</td>

// ✅ CORRECT - Keeps horizontal
<td className="flex items-center gap-2">
  <span>Label:</span>
  <span>Value</span>
</td>
```

### 2. Missing Responsive Grid Classes
```tsx
// ❌ WRONG - Stacks on all screen sizes
<div className="grid grid-cols-1">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// ✅ CORRECT - Horizontal on medium+ screens
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### 3. Cards with Vertical Flex
```tsx
// ❌ WRONG - Content stacks vertically
<div className="card flex flex-col">
  <div>Field 1</div>
  <div>Field 2</div>
</div>

// ✅ CORRECT - Content flows horizontally
<div className="card">
  <div className="grid grid-cols-2 gap-4">
    <div>Field 1</div>
    <div>Field 2</div>
  </div>
</div>
```

## Recommended Fixes

1. **Search for**: `<td className=".*flex-col.*"`
   - Replace with: `<td className="flex items-center gap-2"`

2. **Search for**: `grid-cols-1` (without responsive variants)
   - Add: `md:grid-cols-2 lg:grid-cols-3` as appropriate

3. **Search for**: Cards with `flex-col` that should be horizontal
   - Replace with: `grid grid-cols-2` or horizontal flex

4. **Add to globals.css**:
```css
/* Prevent table cells from stacking */
td, th {
  vertical-align: middle;
}

/* Ensure table content doesn't wrap unnecessarily */
.table-cell-nowrap {
  white-space: nowrap;
}
```

## Files Likely Affected

Based on common patterns, check these files:
- Table components in list pages
- Detail page card layouts
- Status badge containers
- Action button groups
- Form field layouts in tables

## Next Steps

1. Run this audit with authentication to see actual data
2. Manually inspect flagged pages in browser
3. Apply fixes systematically by pattern
4. Test responsive behavior at different breakpoints
