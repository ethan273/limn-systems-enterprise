# Performance Optimization

**Part of Prime Directive** | [Back to Main](../CLAUDE.md)

---

## Performance Optimization Reference

**LATEST OPTIMIZATION:** October 28, 2025 - Options 1, 2, and 5 Complete ✅

### Current Status - MAJOR OPTIMIZATIONS COMPLETE

The application has undergone **two major optimization initiatives**:

#### Phase 1: Initial Optimization (October 2025)
- ✅ **Stage 1: Database Indexes** - 60-80% faster queries
- ✅ **Stage 2: React Query Cache** - 30-50% fewer requests
- ⛔ **Stage 3: SELECT Optimization** - DEFERRED (high risk)
- 🔧 **Stage 5: Pagination Infrastructure** - Components ready

**Result:** 60-80% performance improvement

#### Phase 2: Critical Path Optimization (October 28, 2025) ✅
- ✅ **Option 1: Query Optimization** - 6 critical queries fixed (95% dashboard, 10x materials)
- ✅ **Option 2: Strategic Indexes** - 18 new indexes added (85% search improvement)
- ✅ **Option 5: Bundle Optimization** - Removed 60MB bloat, reduced build memory 50%

**Result:** 70-90% improvement on critical paths

**TOTAL PERFORMANCE IMPROVEMENT:** 75-90% across all critical user flows

### Latest Optimization Results (October 28, 2025)

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Dashboard Load | 60+ seconds | 3-5 seconds | **95%** ✅ |
| Global Search | 2000ms | 300ms | **85%** ✅ |
| Materials Query | O(n*m) | O(log n) | **90%** ✅ |
| Bundle Size | +60MB bloat | Cleaned | **60MB saved** ✅ |
| Build Memory | 8GB | 4GB | **50%** ✅ |

### Key Files & Resources

**Latest Optimization (October 28, 2025)**:
- **Final Summary:** `/Users/eko3/limn-systems-enterprise-docs/02-QUALITY-TOOLS/OPTIMIZATION-FINAL-SUMMARY.md`
- **Analysis Report:** `/Users/eko3/limn-systems-enterprise-docs/02-QUALITY-TOOLS/OPTIMIZATION-ANALYSIS-2025-10-28.md`
- **Session 1 Summary:** `/Users/eko3/limn-systems-enterprise-docs/02-QUALITY-TOOLS/OPTIMIZATION-SESSION1-SUMMARY.md`

**Initial Optimization**:
- **Summary Document:** `/Users/eko3/limn-systems-enterprise-docs/07-DEVELOPMENT-GUIDES/PERFORMANCE/PERFORMANCE-OPTIMIZATION-SUMMARY.md`
- **Decision Record:** `/Users/eko3/limn-systems-enterprise-docs/07-DEVELOPMENT-GUIDES/PERFORMANCE/03-query-optimization-decision.md`
- **Pagination Component:** `src/components/ui/DataTablePagination.tsx`
- **Pagination Hook:** `src/hooks/usePagination.ts`

**Database Migrations**:
- `prisma/migrations/add_performance_indexes.sql` (Phase 1)
- `scripts/migrations/add-global-search-indexes.sql` (Phase 2)
- `scripts/migrations/add-composite-performance-indexes.sql` (Phase 2)

### Database Index Status

- **DEV Database:** 1,314 indexes (includes 930 + 18 new strategic indexes)
- **PROD Database:** 1,314 indexes (verified in sync)
- **Status:** ✅ Both databases fully synchronized
- **Last Update:** October 28, 2025

### React Query Configuration

Enhanced caching configured in `src/lib/api/client.tsx`:
- **staleTime:** 5 minutes (data considered fresh)
- **gcTime:** 10 minutes (garbage collection, React Query v5 compatible)
- **Reduced refetches:** Disabled on window focus and reconnect

### Performance Best Practices

1. **Always use `ctx.db`** for database operations (see Database Access Pattern Standard)
2. **Apply indexes to both databases** (dev and prod must stay in sync)
3. **Defer high-risk optimizations** (SELECT optimization requires manual review)
4. **Use pagination infrastructure** when rolling out list page improvements
5. **Monitor performance metrics** after each optimization deployment

### When Adding Pagination to Pages

Use the prepared infrastructure:

```typescript
import { usePagination } from "@/hooks/usePagination";
import { DataTablePagination } from "@/components/ui/DataTablePagination";

// In your component
const { page, pageSize, skip, take, setPage, setPageSize } = usePagination({
  initialPageSize: 50,
});

// In your tRPC query
const { data } = api.myRouter.query({ skip, take });

// In your JSX
<DataTablePagination
  currentPage={page}
  pageSize={pageSize}
  totalCount={data?.total ?? 0}
  onPageChange={setPage}
  onPageSizeChange={setPageSize}
/>
```

### Optimized Routers (DO NOT RE-OPTIMIZE)

The following routers have been **fully optimized** in Phase 2 (October 28, 2025):

#### ✅ `dashboards.ts` - OPTIMIZED
- **Functions**: `getAnalytics`, `getAnalyticsInsights`
- **Optimization**: Removed "fetch all" pattern, added WHERE clauses, database-level filtering
- **Result**: 95% faster (60s → 3-5s)
- **DO NOT**: Re-add fetchAll pattern or remove WHERE clauses

#### ✅ `products.ts` - OPTIMIZED
- **Function**: `getMaterialsByCollection`
- **Optimization**: Refactored from 4 queries to 1, O(n*m) → O(log n), database JOINs
- **Result**: 10x faster
- **DO NOT**: Revert to in-memory filtering or separate queries

#### ✅ `orders.ts` - OPTIMIZED
- **Function**: `getByProject`
- **Optimization**: Added pagination (take: 500)
- **Result**: 70% faster, prevents timeouts
- **DO NOT**: Remove pagination limits

#### ✅ `projects.ts` - OPTIMIZED
- **Functions**: `getById` (addresses, orders, order_items), `getByCustomer`
- **Optimizations**: Added pagination to 4 queries
- **Result**: 70% faster, predictable performance
- **DO NOT**: Remove pagination limits

### Performance Best Practices (UPDATED October 28, 2025)

1. **Always add pagination** to findMany queries:
   ```typescript
   // ✅ CORRECT
   await ctx.db.table.findMany({
     where: { /* filters */ },
     take: 500, // Always add reasonable limit
     orderBy: { created_at: 'desc' },
   });

   // ❌ WRONG
   await ctx.db.table.findMany({
     where: { /* filters */ },
     // Missing take/limit - risk of timeout
   });
   ```

2. **Use database-level filtering** instead of in-memory:
   ```typescript
   // ✅ CORRECT
   const materials = await ctx.db.materials.findMany({
     where: {
       active: true,
       type: input.materialType,
     },
     include: {
       material_collections: {
         include: { collections: true },
       },
     },
   });

   // ❌ WRONG
   const allMaterials = await ctx.db.materials.findMany();
   const filtered = allMaterials.filter(m => m.type === input.materialType);
   ```

3. **Add selective fields to includes**:
   ```typescript
   // ✅ CORRECT
   include: {
     customers: {
       select: {
         id: true,
         name: true,
         email: true,
       },
     },
   }

   // ⚠️ OK but not optimal
   include: {
     customers: true, // Fetches all fields
   }
   ```

4. **Apply indexes to both databases** (dev and prod must stay in sync)
5. **Use pagination infrastructure** when building list pages
6. **Monitor performance metrics** after each optimization deployment

---

**Status**: ✅ UPDATED October 28, 2025
**Compliance**: Follow patterns documented in performance guide
**Reference**: [Main CLAUDE.md](../CLAUDE.md)
