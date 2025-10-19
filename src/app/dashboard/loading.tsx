/**
 * Dashboard Loading State
 * Phase 6: Error Boundaries and Loading States
 *
 * Displays while dashboard data is being fetched
 */

import { DashboardSkeleton } from '@/components/loading/LoadingSkeletons';

export default function DashboardLoading() {
  return (
    <div className="container mx-auto py-8">
      <DashboardSkeleton />
    </div>
  );
}
