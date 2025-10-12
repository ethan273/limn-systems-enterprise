"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import {
  PageHeader,
  StatsGrid,
  DataTable,
  EmptyState,
  LoadingState,
  StatusBadge,
  type StatItem,
  type DataTableColumn,
} from "@/components/common";
import { DollarSign, Package, TrendingUp, AlertCircle, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function ProductionDashboardPage() {
  const [_dateRange, _setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Auth is handled by middleware - no client-side redirect needed

  const { data: stats } = api.productionTracking.getDashboardStats.useQuery(
    { date_range: _dateRange },
    { enabled: !authLoading && !!user }
  );
  const { data: progress } = api.productionTracking.getProductionProgress.useQuery(
    { limit: 10 },
    { enabled: !authLoading && !!user }
  );

  // Don't render if not authenticated (will redirect)
  if (!user || authLoading) {
    return <LoadingState message="Loading dashboard..." size="lg" />;
  }

  const statItems: StatItem[] = [
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      description: `${stats?.recentOrders || 0} new this week`,
      icon: Package,
      iconColor: 'primary',
    },
    {
      title: 'In Production',
      value: stats?.inProgress || 0,
      description: `${stats?.awaitingDeposit || 0} awaiting deposit`,
      icon: Clock,
      iconColor: 'warning',
    },
    {
      title: 'Completed',
      value: stats?.completed || 0,
      description: `${stats?.completionRate || 0}% completion rate`,
      icon: CheckCircle,
      iconColor: 'success',
    },
    {
      title: 'Total Revenue',
      value: `$${((stats?.totalRevenue || 0) / 1000).toFixed(1)}k`,
      description: `$${((stats?.paidRevenue || 0) / 1000).toFixed(1)}k paid`,
      icon: DollarSign,
      iconColor: 'success',
    },
  ];

  const columns: DataTableColumn<any>[] = [
    {
      key: 'order_number',
      label: 'Order #',
      render: (value, row) => (
        <Link href={`/production/orders/${row.id}`} className="font-medium text-info hover:underline">
          {value as string}
        </Link>
      ),
    },
    {
      key: 'item_name',
      label: 'Item',
    },
    {
      key: 'projects',
      label: 'Project',
      render: (value) => (value as any)?.name || "—",
    },
    {
      key: 'overall_progress',
      label: 'Progress',
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-info transition-all"
              style={{ width: `${value as number}%` }}
            />
          </div>
          <span className="text-xs text-muted">{value as number}%</span>
        </div>
      ),
    },
    {
      key: 'timeline_status',
      label: 'Timeline',
      render: (value) => <StatusBadge status={value as string} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value as string} />,
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Production Dashboard"
        subtitle="Track production orders and progress in real-time"
      />

      <StatsGrid stats={statItems} columns={4} />

      {/* Status Distribution */}
      <div className="card mb-6">
        <div className="card-header">
          <h3 className="card-title">Status Distribution</h3>
        </div>
        <div className="card-content">
          <div className="space-y-2">
            {stats?.statusDistribution && Object.entries(stats.statusDistribution).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusBadge status={status.replace(/_/g, " ")} />
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium">{count as number}</div>
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-info"
                      style={{
                        width: `${((count as number) / (stats.totalOrders || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Status */}
      <div className="card mb-6">
        <div className="card-header">
          <h3 className="card-title">Timeline Status</h3>
        </div>
        <div className="card-content">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="icon-sm text-success" />
                <span className="text-sm">On Track</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status="on_track" />
                <span className="text-sm font-medium">{stats?.timelineDistribution.on_track || 0}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="icon-sm text-warning" />
                <span className="text-sm">At Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status="at_risk" />
                <span className="text-sm font-medium">{stats?.timelineDistribution.at_risk || 0}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="icon-sm text-destructive" />
                <span className="text-sm">Delayed</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status="delayed" />
                <span className="text-sm font-medium">{stats?.timelineDistribution.delayed || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Production Orders */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="card-title">Recent Production Orders</h3>
            <Link href="/production/orders" className="text-sm text-info hover:underline">
              View All
            </Link>
          </div>
        </div>
        <div className="card-content">
          {!progress?.items || progress.items.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No recent orders"
              description="Production orders will appear here"
            />
          ) : (
            <DataTable
              data={progress.items}
              columns={columns}
              onRowClick={(row) => router.push(`/production/orders/${row.id}`)}
              emptyState={{
                icon: Package,
                title: 'No orders found',
                description: 'Production orders will appear here',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
