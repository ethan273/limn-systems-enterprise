/**
 * Production Orders Loading State
 * Phase 6: Error Boundaries and Loading States
 *
 * Displays while production orders data is being fetched
 */

import { PageHeaderSkeleton, TableSkeleton } from '@/components/loading/LoadingSkeletons';

export default function ProductionOrdersLoading() {
  return (
    <div className="container mx-auto py-8">
      <PageHeaderSkeleton />
      <TableSkeleton rows={10} columns={7} />
    </div>
  );
}
