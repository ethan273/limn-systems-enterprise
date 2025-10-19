'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Lazy-loaded Data Table Components
 * Phase 4: Bundle Optimization
 *
 * Only loads heavy table libraries when needed
 * Reduces initial bundle by ~100KB
 */

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

export const LazyDataTable = dynamic(
  () => import('@/components/tables/DataTable').catch(() => ({
    default: () => <div>Data Table not available</div>
  })),
  {
    loading: () => <TableSkeleton />,
    ssr: true, // Tables can be server-rendered
  }
);

export const LazyAdvancedTable = dynamic(
  () => import('@/components/tables/AdvancedTable').catch(() => ({
    default: () => <div>Advanced Table not available</div>
  })),
  {
    loading: () => <TableSkeleton />,
    ssr: false, // Advanced features may need client-side
  }
);
