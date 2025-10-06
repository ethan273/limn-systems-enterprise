'use client';

import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard';
import { LucideIcon } from 'lucide-react';

// Type definitions
export interface StatItem {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  iconColor?: 'info' | 'success' | 'warning' | 'destructive' | 'primary';
  trend?: number;
  trendDirection?: 'up' | 'down';
}

export interface StatsGridProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4;
}

export function StatsGrid({ stats, columns = 3 }: StatsGridProps) {
  // Determine grid class based on columns
  const gridClass = columns === 4 ? 'stats-grid-lg' : 'stats-grid';

  return (
    <div className={gridClass}>
      {stats.map((stat, index) => (
        <DashboardStatCard
          key={index}
          title={stat.title}
          value={stat.value}
          description={stat.description}
          icon={stat.icon}
          iconColor={stat.iconColor}
        />
      ))}
    </div>
  );
}
