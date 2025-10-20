# Global Filtering System Migration Guide

**Date**: October 19, 2025
**Status**: Production-Ready
**Affects**: 43 pages using DataTable component

## Table of Contents
1. [Overview](#overview)
2. [Problem Statement](#problem-statement)
3. [Solution Architecture](#solution-architecture)
4. [Migration Steps](#migration-steps)
5. [Reference Implementation](#reference-implementation)
6. [Affected Files](#affected-files)
7. [Production Considerations](#production-considerations)

---

## Overview

This guide documents the migration from inconsistent filtering patterns to a unified, production-ready filtering system that eliminates redundancy and ensures consistent behavior across all list pages.

### Key Changes
- ✅ **New Hook**: `useTableFilters` for unified filter state management
- ✅ **New Components**: `TableFilters.*` for controlled filter UI
- ✅ **Debounced Search**: Automatic 300ms debounce for search inputs
- ✅ **Backend-Only Filtering**: All filtering happens server-side
- ✅ **Production-Optimized**: Works with Vercel, Supabase, and Prisma

---

## Problem Statement

### Issues Identified

**Issue #1: Redundant Filtering**
- DataTable component performed client-side filtering on already-filtered backend data
- Same filters applied twice (backend query + client-side)
- Confusing which filter layer was actually working

**Issue #2: Inconsistent Patterns Across 43 Files**
```
Pattern A (Backend Only): /partners/designers, /partners/factories
Pattern B (Client Only): /crm/contacts, /tasks, /products/catalog
Pattern C (Mixed/Hybrid): /design/projects, /production/qc, /admin/roles
Pattern D (Redundant): /financials/invoices, /financials/payments
```

**Issue #3: Search Not Synced to Backend**
- 14+ pages defined search filters but didn't pass to backend
- Backend returned ALL records (100-item limit)
- Search only worked client-side (scalability issue)

**Issue #4: Pagination Mismatch**
- DataTable hardcoded `pageSize: 20` but backend used `limit: 100, offset: 0`
- Pagination config in DataTable not respected by backend queries

---

## Solution Architecture

### New Components

#### 1. `useTableFilters` Hook
```typescript
// Location: /src/hooks/useTableFilters.ts

interface UseTableFiltersOptions<T> {
  initialFilters: T;
  debounceMs?: number; // Default: 300ms
}

// Returns:
{
  filters: T;              // Debounced filter values
  rawFilters: T;           // Immediate filter values (for UI)
  setFilter: (key, value) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  queryParams: Partial<T>; // Ready for backend API (omits 'all', empty strings)
}
```

**Features:**
- ✅ Debounces search automatically (reduces API calls)
- ✅ Generates backend-ready query parameters
- ✅ Omits 'all' and empty string values
- ✅ Type-safe filter definitions

#### 2. `useTableState` Hook (Combines Filters + Pagination)
```typescript
// Returns everything from useTableFilters PLUS:
{
  page: number;
  pageSize: number;
  setPage: (page) => void;
  setPageSize: (size) => void;
  resetPage: () => void;
  paginationParams: { limit, offset };
  queryParams: { ...filters, limit, offset }; // Combined
}
```

**Features:**
- ✅ Automatically resets to page 1 when filters change
- ✅ Coordinates pagination with filtering
- ✅ Single `queryParams` object for backend

#### 3. `TableFilters` Components
```typescript
// Location: /src/components/common/TableFilters.tsx

<TableFilters.Bar
  hasActiveFilters={hasActiveFilters}
  onClearFilters={clearFilters}
>
  <TableFilters.Search
    value={rawFilters.search}
    onChange={(value) => setFilter('search', value)}
    placeholder="Search..."
  />

  <TableFilters.Select
    value={rawFilters.status}
    onChange={(value) => setFilter('status', value)}
    options={[
      { value: '', label: 'All Statuses' },
      { value: 'active', label: 'Active' },
    ]}
  />

  <TableFilters.DateRange
    fromValue={rawFilters.dateFrom}
    toValue={rawFilters.dateTo}
    onFromChange={(value) => setFilter('dateFrom', value)}
    onToChange={(value) => setFilter('dateTo', value)}
  />
</TableFilters.Bar>
```

---

## Migration Steps

### Step 1: Remove DataTable Filters Config

**Before:**
```typescript
const filters: DataTableFilter[] = [
  {
    key: 'search',
    label: 'Search',
    type: 'search',
    placeholder: 'Search...',
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'all', label: 'All Statuses' },
      { value: 'active', label: 'Active' },
    ],
  },
];

<DataTable
  data={data}
  columns={columns}
  filters={filters}  // ❌ Remove this
  onRowClick={handleRowClick}
/>
```

**After:**
```typescript
// ✅ No filters prop
<DataTable
  data={data}
  columns={columns}
  onRowClick={handleRowClick}
/>
```

### Step 2: Replace useState with useTableState

**Before:**
```typescript
const [search, setSearch] = useState("");
const [status, setStatus] = useState("all");
const [dateFrom, setDateFrom] = useState("");
const [dateTo, setDateTo] = useState("");

const { data } = api.entity.getAll.useQuery({
  search: search || undefined,
  status: status === "all" ? undefined : status,
  dateFrom: dateFrom || undefined,
  dateTo: dateTo || undefined,
  limit: 100,
  offset: 0,
});

const handleClearFilters = () => {
  setSearch("");
  setStatus("all");
  setDateFrom("");
  setDateTo("");
};

const hasActiveFilters = search || status !== "all" || dateFrom || dateTo;
```

**After:**
```typescript
import { useTableState } from "@/hooks/useTableFilters";

const {
  rawFilters,
  setFilter,
  clearFilters,
  hasActiveFilters,
  queryParams,
} = useTableState({
  initialFilters: {
    search: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  },
  debounceMs: 300,
  pageSize: 100,
});

const { data } = api.entity.getAll.useQuery(queryParams);
```

### Step 3: Replace Manual Filter UI with TableFilters Components

**Before:**
```typescript
<div className="card mb-6">
  <div className="p-4 space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" />
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger>
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
        </SelectContent>
      </Select>

      {/* Date inputs... */}
    </div>

    {hasActiveFilters && (
      <div className="flex justify-end">
        <Button onClick={handleClearFilters}>
          <X className="w-4 h-4 mr-2" />
          Clear Filters
        </Button>
      </div>
    )}
  </div>
</div>
```

**After:**
```typescript
import { TableFilters } from "@/components/common";

<TableFilters.Bar
  hasActiveFilters={hasActiveFilters}
  onClearFilters={clearFilters}
>
  <TableFilters.Search
    value={rawFilters.search}
    onChange={(value) => setFilter('search', value)}
    placeholder="Search..."
  />

  <TableFilters.Select
    value={rawFilters.status}
    onChange={(value) => setFilter('status', value)}
    options={[
      { value: '', label: 'All Statuses' },
      { value: 'active', label: 'Active' },
    ]}
  />

  <TableFilters.DateRange
    fromValue={rawFilters.dateFrom}
    toValue={rawFilters.dateTo}
    onFromChange={(value) => setFilter('dateFrom', value)}
    onToChange={(value) => setFilter('dateTo', value)}
  />
</TableFilters.Bar>
```

---

## Reference Implementation

### Complete Example: Expenses Page

See `/src/app/financials/expenses/page.tsx` for the complete reference implementation.

**Key Features:**
- ✅ Uses `useTableState` hook
- ✅ Uses `TableFilters.*` components
- ✅ 300ms debounced search
- ✅ All filtering happens server-side
- ✅ Clean, maintainable code

**Code Highlights:**
```typescript
const {
  rawFilters,
  setFilter,
  clearFilters,
  hasActiveFilters,
  queryParams,
} = useTableState({
  initialFilters: {
    search: '',
    category: '',
    approval_status: '',
    dateFrom: '',
    dateTo: '',
  },
  debounceMs: 300,
  pageSize: 100,
});

const { data } = api.expenses.getAll.useQuery(queryParams);

// Transform backend data to SelectOption format
const categoryOptions = [
  { value: '', label: 'All Categories' },
  ...categories.map((cat: string) => ({ value: cat, label: cat })),
];

// Use TableFilters components
<TableFilters.Bar hasActiveFilters={hasActiveFilters} onClearFilters={clearFilters}>
  <TableFilters.Search
    value={rawFilters.search}
    onChange={(value) => setFilter('search', value)}
    placeholder="Search expenses..."
  />
  <TableFilters.Select
    value={rawFilters.category}
    onChange={(value) => setFilter('category', value)}
    options={categoryOptions}
  />
  // ... more filters
</TableFilters.Bar>
```

---

## Affected Files

**Total: 43 files need migration**

### Priority 1: High Impact (Backend Filtering Broken)
These pages have search/filters defined but not passed to backend:

1. `/src/app/crm/leads/page.tsx`
2. `/src/app/crm/contacts/page.tsx`
3. `/src/app/crm/customers/page.tsx`
4. `/src/app/tasks/page.tsx`
5. `/src/app/tasks/my/page.tsx`
6. `/src/app/design/briefs/page.tsx`
7. `/src/app/design/documents/page.tsx`
8. `/src/app/products/catalog/page.tsx`
9. `/src/app/products/concepts/page.tsx`
10. `/src/app/products/prototypes/page.tsx`
11. `/src/app/flipbooks/page.tsx`

### Priority 2: Medium Impact (Mixed Patterns)
These have partial backend filtering:

12. `/src/app/design/projects/page.tsx`
13. `/src/app/production/qc/page.tsx`
14. `/src/app/production/ordered-items/page.tsx`
15. `/src/app/production/packing/page.tsx`
16. `/src/app/shipping/shipments/page.tsx`
17. `/src/app/crm/prospects/page.tsx`
18. `/src/app/admin/roles/page.tsx`

### Priority 3: Low Impact (Already Working, Needs Cleanup)
These work but have redundant filtering:

19. `/src/app/financials/invoices/page.tsx`
20. `/src/app/financials/payments/page.tsx`
21. `/src/app/partners/designers/page.tsx`
22. `/src/app/partners/factories/page.tsx`

### Remaining 21 Files
See comprehensive audit output for full list.

---

## Production Considerations

### Vercel Deployment
✅ **Compatible**: New system works seamlessly with Vercel
- Server-side filtering reduces client-side bundle size
- Debouncing reduces API calls (lower costs)
- Works with Edge Runtime and Node.js Runtime

### Supabase/Prisma
✅ **Optimized**: Backend queries are more efficient
```typescript
// Old: Client filters 100 records
const allData = await prisma.table.findMany({ take: 100 });
// Client-side: filter, sort, paginate

// New: Backend does everything
const filtered = await prisma.table.findMany({
  where: {
    status: filters.status,
    created_at: { gte: filters.dateFrom, lte: filters.dateTo },
    // ... indexed fields
  },
  take: filters.limit,
  skip: filters.offset,
  orderBy: { created_at: 'desc' },
});
```

**Performance Benefits:**
- ✅ Reduces data transfer
- ✅ Leverages database indexes
- ✅ Scales to millions of records
- ✅ Lower memory usage on client

### Database Indexing Recommendations
For optimal performance, ensure these indexes exist:

```sql
-- Common filter columns should be indexed
CREATE INDEX idx_status ON table_name(status);
CREATE INDEX idx_created_at ON table_name(created_at);
CREATE INDEX idx_search ON table_name USING gin(to_tsvector('english', searchable_column));
```

### Monitoring
Track these metrics after migration:
- Average query response time
- Number of API calls per user session
- Client-side bundle size
- Database query performance

---

## Testing Checklist

For each migrated page, verify:

- [ ] Search input has 300ms debounce (type fast, watch network tab)
- [ ] All filters update URL query params (optional feature)
- [ ] Clear Filters button resets all filters
- [ ] Backend query receives correct parameters
- [ ] Empty filter values ('', 'all') are omitted from query
- [ ] Loading states work correctly
- [ ] Error states display properly
- [ ] Pagination resets to page 1 when filters change
- [ ] Results update immediately (no stale data)
- [ ] No console errors or warnings

---

## Rollback Plan

If issues arise, rollback is straightforward:

1. Revert the affected page file to previous commit
2. System is backwards-compatible
3. No database migrations required
4. No breaking API changes

---

## Support and Questions

For migration assistance:
- See reference implementation: `/src/app/financials/expenses/page.tsx`
- Review hook documentation: `/src/hooks/useTableFilters.ts`
- Check component props: `/src/components/common/TableFilters.tsx`

---

## Migration Progress Tracker

Track your progress:

```
✅ Expenses (Reference Implementation)
⏳ Invoices
⏳ Payments
⏳ CRM Leads
⏳ CRM Contacts
... (39 more files)
```

---

**Document Version**: 1.0
**Last Updated**: October 19, 2025
**Author**: Claude Code
**Status**: Ready for Production
