'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Lazy-loaded Chart Components
 * Phase 4: Bundle Optimization
 *
 * Only loads Chart.js when charts are rendered
 * Reduces initial bundle by ~200KB
 */

const ChartSkeleton = () => (
  <div className="w-full h-64 flex items-center justify-center bg-muted/30 rounded-lg">
    <Skeleton className="h-full w-full" />
  </div>
);

export const LazyLineChart = dynamic(
  () => import('@/components/charts/LineChart').catch(() => ({
    default: () => <div>Line Chart not available</div>
  })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

export const LazyBarChart = dynamic(
  () => import('@/components/charts/BarChart').catch(() => ({
    default: () => <div>Bar Chart not available</div>
  })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

export const LazyPieChart = dynamic(
  () => import('@/components/charts/PieChart').catch(() => ({
    default: () => <div>Pie Chart not available</div>
  })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

export const LazyAreaChart = dynamic(
  () => import('@/components/charts/AreaChart').catch(() => ({
    default: () => <div>Area Chart not available</div>
  })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);
