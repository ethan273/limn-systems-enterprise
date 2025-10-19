'use client';

/**
 * Lazy-loaded Data Table Components
 * Phase 4: Bundle Optimization
 *
 * NOTE: This file is a placeholder for future table library components.
 * The application currently uses DataTable from @/components/common.
 *
 * These exports are kept for future compatibility when separate
 * table components are created in @/components/tables/
 */

import { Skeleton } from '@/components/ui/skeleton';

const TableSkeleton = () => (
  <div className="w-full space-y-3">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-16 w-full" />
    <Skeleton className="h-16 w-full" />
    <Skeleton className="h-16 w-full" />
    <Skeleton className="h-16 w-full" />
    <Skeleton className="h-16 w-full" />
  </div>
);

// Placeholder components - will be implemented when table components are created
export const LazyDataTable = TableSkeleton;
export const LazyAdvancedTable = TableSkeleton;
