'use client';

/**
 * Lazy-loaded Recharts Components
 * Phase 4: Bundle Optimization - Frontend Implementation
 *
 * Lazy loads recharts library only when charts are actually rendered
 * Reduces initial bundle by ~150-200KB
 */

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ChartSkeleton = () => (
  <div className="w-full h-64 flex items-center justify-center bg-muted/30 rounded-lg">
    <Skeleton className="h-full w-full" />
  </div>
);

// Lazy load the entire recharts library
export const LazyPieChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.PieChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
) as any;

export const LazyPie = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Pie })),
  {
    loading: () => null,
    ssr: false,
  }
) as any;

export const LazyLineChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.LineChart })),
  { loading: () => <ChartSkeleton />, ssr: false }
) as any;

export const LazyLine = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Line })),
  { loading: () => null, ssr: false }
) as any;

export const LazyBarChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.BarChart })),
  { loading: () => <ChartSkeleton />, ssr: false }
) as any;

export const LazyBar = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Bar })),
  { loading: () => null, ssr: false }
) as any;

export const LazyAreaChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.AreaChart })),
  { loading: () => <ChartSkeleton />, ssr: false }
) as any;

export const LazyArea = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Area })),
  { loading: () => null, ssr: false }
) as any;

export const LazyXAxis = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.XAxis })),
  { loading: () => null, ssr: false }
) as any;

export const LazyYAxis = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.YAxis })),
  { loading: () => null, ssr: false }
) as any;

export const LazyCartesianGrid = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.CartesianGrid })),
  { loading: () => null, ssr: false }
) as any;

export const LazyTooltip = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Tooltip })),
  { loading: () => null, ssr: false }
) as any;

export const LazyLegend = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Legend })),
  { loading: () => null, ssr: false }
) as any;

export const LazyResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.ResponsiveContainer })),
  { loading: () => <ChartSkeleton />, ssr: false }
) as any;

export const LazyCell = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Cell })),
  { loading: () => null, ssr: false }
) as any;

export const LazyComposedChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.ComposedChart })),
  { loading: () => <ChartSkeleton />, ssr: false }
) as any;

export const LazyRadarChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.RadarChart })),
  { loading: () => <ChartSkeleton />, ssr: false }
) as any;

export const LazyRadar = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Radar })),
  { loading: () => null, ssr: false }
) as any;

export const LazyPolarGrid = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.PolarGrid })),
  { loading: () => null, ssr: false }
) as any;

export const LazyPolarAngleAxis = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.PolarAngleAxis })),
  { loading: () => null, ssr: false }
) as any;

export const LazyPolarRadiusAxis = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.PolarRadiusAxis })),
  { loading: () => null, ssr: false }
) as any;
