/**
 * Tasks Loading State
 * Phase 6: Error Boundaries and Loading States
 *
 * Displays while tasks data is being fetched
 */

import { PageHeaderSkeleton, TableSkeleton } from '@/components/loading/LoadingSkeletons';
import { CardSkeleton } from '@/components/loading/LoadingSkeletons';

export default function TasksLoading() {
  return (
    <div className="container mx-auto py-8">
      <PageHeaderSkeleton />

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      {/* Tasks Table */}
      <TableSkeleton rows={8} columns={6} />
    </div>
  );
}
