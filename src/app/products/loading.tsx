/**
 * Products Loading State
 * Phase 6: Error Boundaries and Loading States
 *
 * Displays while products data is being fetched
 */

import { PageHeaderSkeleton, GridSkeleton } from '@/components/loading/LoadingSkeletons';

export default function ProductsLoading() {
  return (
    <div className="container mx-auto py-8">
      <PageHeaderSkeleton />
      <GridSkeleton items={12} columns={4} />
    </div>
  );
}
