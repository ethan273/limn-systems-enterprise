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
// NOTE: Using 'as any' to bypass TypeScript strict type checking on dynamic imports
export const LazyPieChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.PieChart as any })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
) as any;

export const LazyPie = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Pie as any })),
  {
    loading: () => null,
    ssr: false,
  }
) as any;

export const LazyLineChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.LineChart as any })),
  { loading: () => <ChartSkeleton />, ssr: false }
) as any;

export const LazyLine = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Line as any })),
  { loading: () => null, ssr: false }
) as any;

export const LazyBarChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.BarChart as any })),
  { loading: () => <ChartSkeleton />, ssr: false }
) as any;

export const LazyBar = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Bar as any })),
  { loading: () => null, ssr: false }
) as any;

export const LazyAreaChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.AreaChart as any })),
  { loading: () => <ChartSkeleton />, ssr: false }
) as any;

export const LazyArea = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Area as any })),
  { loading: () => null, ssr: false }
) as any;

export const LazyXAxis = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.XAxis as any })),
  { loading: () => null, ssr: false }
) as any;

export const LazyYAxis = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.YAxis as any })),
  { loading: () => null, ssr: false }
) as any;

export const LazyCartesianGrid = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.CartesianGrid as any })),
  { loading: () => null, ssr: false }
) as any;

export const LazyTooltip = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Tooltip as any })),
  { loading: () => null, ssr: false }
) as any;

export const LazyLegend = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Legend as any })),
  { loading: () => null, ssr: false }
) as any;

export const LazyResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.ResponsiveContainer as any })),
  { loading: () => <ChartSkeleton />, ssr: false }
) as any;

export const LazyCell = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Cell as any })),
  { loading: () => null, ssr: false }
) as any;

export const LazyComposedChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.ComposedChart as any })),
  { loading: () => <ChartSkeleton />, ssr: false }
) as any;

export const LazyRadarChart = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.RadarChart as any })),
  { loading: () => <ChartSkeleton />, ssr: false }
) as any;

export const LazyRadar = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.Radar as any })),
  { loading: () => null, ssr: false }
) as any;

export const LazyPolarGrid = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.PolarGrid as any })),
  { loading: () => null, ssr: false }
) as any;

export const LazyPolarAngleAxis = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.PolarAngleAxis as any })),
  { loading: () => null, ssr: false }
) as any;

export const LazyPolarRadiusAxis = dynamic(
  () => import('recharts').then((mod) => ({ default: mod.PolarRadiusAxis as any })),
  { loading: () => null, ssr: false }
) as any;
