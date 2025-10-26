# Performance Optimization

**Part of Prime Directive** | [Back to Main](../CLAUDE.md)

---

## Performance Optimization Reference

**COMPREHENSIVE DOCUMENTATION:** See `/Users/eko3/limn-systems-enterprise-docs/07-DEVELOPMENT-GUIDES/PERFORMANCE/PERFORMANCE-OPTIMIZATION-SUMMARY.md`

### Overview

The application has undergone comprehensive performance optimization with the following results:

- ✅ **Stage 1: Database Indexes** - 60-80% faster queries (COMPLETE)
- ✅ **Stage 2: React Query Cache** - 30-50% fewer requests (COMPLETE)
- ⛔ **Stage 3: SELECT Optimization** - DEFERRED (high risk, manual review required)
- 🔧 **Stage 5: Pagination Infrastructure** - Components ready for deployment
- 📋 **Stage 4 & 6:** Planned for future implementation

**Total Performance Improvement Achieved:** 60-80%
**Expected After Pagination:** 75-85%

### Key Files & Resources

- **Summary Document:** `/Users/eko3/limn-systems-enterprise-docs/07-DEVELOPMENT-GUIDES/PERFORMANCE/PERFORMANCE-OPTIMIZATION-SUMMARY.md`
- **Decision Record:** `/Users/eko3/limn-systems-enterprise-docs/07-DEVELOPMENT-GUIDES/PERFORMANCE/03-query-optimization-decision.md`
- **Database Migration:** `prisma/migrations/add_performance_indexes.sql`
- **Pagination Component:** `src/components/ui/DataTablePagination.tsx`
- **Pagination Hook:** `src/hooks/usePagination.ts`
- **Analysis Scripts:** `scripts/add-pagination-to-queries.ts`

### Database Index Status

- **DEV Database:** 1,207 indexes (includes 930 performance indexes)
- **PROD Database:** 1,231 indexes (includes 930 performance indexes)
- **Status:** ✅ Both databases in sync and verified

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

---

**Status**: ✅ DOCUMENTED October 21, 2025
**Compliance**: Follow patterns documented in performance guide
**Reference**: [Main CLAUDE.md](../CLAUDE.md)
