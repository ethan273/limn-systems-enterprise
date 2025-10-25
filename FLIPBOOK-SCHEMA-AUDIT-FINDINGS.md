# Flipbook Schema Audit - Comprehensive Findings

**Date**: October 25, 2025
**Purpose**: Systematic audit to prevent recurring field/table mismatch errors in production
**Scope**: All flipbook-related database queries against Prisma schema

---

## Executive Summary

✅ **Current status**: Fixed most field name errors (product_id → target_product_id)
⚠️ **CRITICAL ISSUE FOUND**: `getHotspotHeatMap` query uses `include` on Unsupported field model
✅ **Field names**: All correct in existing queries
⚠️ **Incomplete data**: `hotspots.createMany` only creates partial hotspot data

---

## Schema Reference

### Tables Audited
1. ✅ **flipbooks** - 19 scalar fields, 4 relations
2. ✅ **flipbook_pages** - 14 scalar fields, 2 relations
3. ✅ **hotspots** - 16 scalar fields, 2 relations
4. ✅ **flipbook_share_links** - 14 scalar fields, 3 relations

### Unsupported Fields (CANNOT be selected)
- `flipbooks.status` → `Unsupported("flipbook_status")`
- `flipbook_pages.page_type` → `Unsupported("page_type")`
- `hotspots.hotspot_type` → `Unsupported("hotspot_type")`

---

## Critical Issues Found

### 🚨 ISSUE #1: getHotspotHeatMap uses `include` with Unsupported fields
**Location**: `src/server/api/routers/flipbooks.ts:1853-1878`
**Severity**: HIGH - Will cause runtime database errors
**Error**: "column hotspots.hotspot_type does not exist"

**Current Code** (BROKEN):
```typescript
const hotspots = await ctx.db.hotspots.findMany({
  where: {
    flipbook_pages: {
      flipbook_id: input.flipbookId,
      ...(input.pageId ? { id: input.pageId } : {}),
    },
  },
  include: {  // ❌ PROBLEM: include returns ALL fields including hotspot_type
    flipbook_pages: {
      select: { id: true, page_number: true, image_url: true },
    },
    products: {
      select: { id: true, name: true },
    },
  },
  orderBy: { click_count: 'desc' },
});
```

**Root Cause**: Models with Unsupported fields CANNOT use `include` - must use explicit `select`

**Fix Required**: Convert to explicit `select` statement excluding `hotspot_type`

---

### ⚠️ ISSUE #2: Incomplete hotspot creation in duplicate endpoint
**Location**: `src/server/api/routers/flipbooks.ts:1802-1811`
**Severity**: MEDIUM - Data loss on duplicate operation
**Impact**: Missing fields when duplicating flipbooks with hotspots

**Current Code** (INCOMPLETE):
```typescript
await ctx.db.hotspots.createMany({
  data: page.hotspots.map(hotspot => ({
    page_id: newPage.id,
    target_product_id: hotspot.target_product_id,  // ✅ Correct field name
    x_position: hotspot.x_position,
    y_position: hotspot.y_position,
    width: hotspot.width,
    height: hotspot.height,
    // ❌ MISSING: target_url, target_page, popup_content, form_config, style_config, click_count
  })),
});
```

**Missing Fields**:
- `target_url` - URL hotspots won't work
- `target_page` - Page jump hotspots won't work
- `popup_content` - Popups won't work
- `form_config` - Forms won't work
- `style_config` - Custom styling lost
- `click_count` - Analytics data lost (should be 0 for new)

**Fix Required**: Add all hotspot fields to createMany

---

## Verified Correct Queries

### ✅ getById Query (Lines 216-329)
- Correctly splits query to avoid Unsupported field issues
- Uses explicit `select` for all models
- Properly excludes: `status`, `page_type`, `hotspot_type`
- Uses `target_product_id` (correct field name)
- Fetches hotspots separately and maps to pages

### ✅ Other Queries Checked
- `create`, `update`, `delete` operations: All use correct field names
- No other `include` usage on Unsupported field models detected
- All uses of `target_product_id` are correct (no `product_id` found)

---

## Recommended Fixes

### Fix #1: getHotspotHeatMap Query

**Replace lines 1853-1878 with**:
```typescript
// Get hotspots with click counts
const hotspots = await ctx.db.hotspots.findMany({
  where: {
    flipbook_pages: {
      flipbook_id: input.flipbookId,
      ...(input.pageId ? { id: input.pageId } : {}),
    },
  },
  select: {
    id: true,
    page_id: true,
    // hotspot_type: true, // CRITICAL: Unsupported type - cannot select
    x_position: true,
    y_position: true,
    width: true,
    height: true,
    target_url: true,
    target_page: true,
    target_product_id: true,
    popup_content: true,
    form_config: true,
    style_config: true,
    click_count: true,
    created_at: true,
    updated_at: true,
    flipbook_pages: {
      select: {
        id: true,
        page_number: true,
        image_url: true,
      },
    },
    products: {
      select: {
        id: true,
        name: true,
      },
    },
  },
  orderBy: { click_count: 'desc' },
});
```

### Fix #2: Complete hotspot duplication

**Replace lines 1802-1811 with**:
```typescript
await ctx.db.hotspots.createMany({
  data: page.hotspots.map(hotspot => ({
    page_id: newPage.id,
    // NOTE: hotspot_type cannot be set via createMany (Unsupported field)
    // It will use database default
    x_position: hotspot.x_position,
    y_position: hotspot.y_position,
    width: hotspot.width,
    height: hotspot.height,
    target_url: hotspot.target_url,
    target_page: hotspot.target_page,
    target_product_id: hotspot.target_product_id,
    popup_content: hotspot.popup_content,
    form_config: hotspot.form_config,
    style_config: hotspot.style_config,
    click_count: 0, // Reset click count for duplicated hotspot
  })),
});
```

---

## Prevention Strategy

### Going Forward:
1. **Never use `include`** on models with Unsupported fields
2. **Always use explicit `select`** for: flipbooks, flipbook_pages, hotspots
3. **Comment Unsupported fields** with `// CRITICAL: Unsupported type - cannot select`
4. **Test in production** after any query changes to catch field errors early

### Verification Checklist:
- [ ] No `include` on flipbooks, flipbook_pages, or hotspots
- [ ] All hotspot queries use `target_product_id` not `product_id`
- [ ] All select statements exclude Unsupported fields
- [ ] createMany includes all necessary fields

---

## Files Requiring Changes

1. **src/server/api/routers/flipbooks.ts**:
   - Line 1853-1878: Convert `getHotspotHeatMap` to use `select`
   - Line 1802-1811: Add missing fields to `hotspots.createMany`

---

## Testing Plan

After fixes are applied:

1. ✅ Run TypeScript check: `npx tsc --noEmit`
2. ✅ Test getById endpoint with flipbook containing hotspots
3. ✅ Test getHotspotHeatMap endpoint
4. ✅ Test duplicate flipbook with hotspots
5. ✅ Verify all hotspot data preserved in duplication

---

**Audit Status**: Complete
**Issues Found**: 2
**Severity**: 1 HIGH, 1 MEDIUM
**Next Step**: Apply fixes and test
