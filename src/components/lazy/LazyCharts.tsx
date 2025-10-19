'use client';

/**
 * Lazy-loaded Chart Components
 * Phase 4: Bundle Optimization
 *
 * NOTE: This file is a placeholder for future Chart.js-based chart components.
 * Currently, the application uses recharts (see LazyRecharts.tsx).
 *
 * These exports are kept for future compatibility when custom Chart.js
 * components are created in @/components/charts/
 */

import { Skeleton } from '@/components/ui/skeleton';

const ChartSkeleton = () => (
  <div className="w-full h-64 flex items-center justify-center bg-muted/30 rounded-lg">
    <Skeleton className="h-full w-full" />
  </div>
);

// Placeholder components - will be implemented when Chart.js components are created
export const LazyLineChart = ChartSkeleton;
export const LazyBarChart = ChartSkeleton;
export const LazyPieChart = ChartSkeleton;
export const LazyAreaChart = ChartSkeleton;
