/**
 * Invoices Loading State
 * Phase 6: Error Boundaries and Loading States
 *
 * Displays while invoices data is being fetched
 */

import { PageHeaderSkeleton, TableSkeleton } from '@/components/loading/LoadingSkeletons';

export default function InvoicesLoading() {
  return (
    <div className="container mx-auto py-8">
      <PageHeaderSkeleton />
      <TableSkeleton rows={10} columns={6} />
    </div>
  );
}
