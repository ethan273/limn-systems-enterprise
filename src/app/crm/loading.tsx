/**
 * CRM Loading State
 * Phase 6: Error Boundaries and Loading States
 *
 * Displays while CRM data is being fetched
 */

import { PageHeaderSkeleton, TableSkeleton } from '@/components/loading/LoadingSkeletons';
import { CardSkeleton } from '@/components/loading/LoadingSkeletons';

export default function CRMLoading() {
  return (
    <div className="container mx-auto py-8">
      <PageHeaderSkeleton />

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      {/* Customers/Leads Table */}
      <TableSkeleton rows={10} columns={5} />
    </div>
  );
}
