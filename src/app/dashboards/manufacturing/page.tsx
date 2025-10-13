'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangeSelector } from '@/components/DateRangeSelector';
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard';
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  Activity,
  Lightbulb,
  ArrowRight,
  PlayCircle,
  RefreshCw,
} from 'lucide-react';
import { ExportPDFButton } from '@/components/ExportPDFButton';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Dynamic route configuration
export const dynamic = 'force-dynamic';

const STATUS_COLORS: Record<string, string> = {
  Pending: '#f59e0b',
  'In Progress': '#3b82f6',
  Completed: '#10b981',
  'On Hold': '#6b7280',
  Cancelled: '#ef4444',
};

const INSIGHT_ICONS = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertTriangle,
  info: Lightbulb,
};

const INSIGHT_CLASSES = {
  success: 'insight-success',
  warning: 'insight-warning',
  error: 'insight-error',
  info: 'insight-info',
};

export default function ManufacturingDashboardPage() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const { data: manufacturing, isLoading } = api.dashboards.getManufacturing.useQuery(
    { dateRange },
    { refetchInterval: 60000 } // Auto-refresh every 60 seconds
  );

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  const { data: insights } = api.dashboards.getManufacturingInsights.useQuery();

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading manufacturing dashboard...</p>
        </div>
      </div>
    );
  }

  if (!manufacturing) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-error">
          <AlertTriangle className="error-icon" />
          <p>Failed to load manufacturing data</p>
        </div>
      </div>
    );
  }

  const { summary, quality, performance, statusDistribution, productionTrend, topProducts } = manufacturing;

  return (
    <div className="dashboard-page">
      <div id="dashboard-export-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Manufacturing & Production Dashboard</h1>
          <p className="page-subtitle">Production metrics, quality control, and capacity management</p>
        </div>
        <div className="dashboard-actions">
          <DateRangeSelector
            value={dateRange}
            onChange={(value: any) => setDateRange(value)}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => utils.dashboards.getManufacturing.invalidate()}
            title="Refresh data"
          >
            <RefreshCw className="icon-sm" />
          </Button>
          <ExportPDFButton dashboardName="Manufacturing Dashboard" dateRange={dateRange} />
          <Button variant="outline" asChild>
            <Link href="/production/ordered-items">
              <Package className="icon-sm" />
              View Production
            </Link>
          </Button>
        </div>
      </div>

      {/* Production Orders Metrics */}
      <div className="dashboard-section">
        <div className="dashboard-grid">
        <DashboardStatCard
          title="Total Production Orders"
          value={summary.totalOrders}
          description={`${summary.completedOrders} completed`}
          icon={Package}
          iconColor="primary"
        />

        <DashboardStatCard
          title="Active Orders"
          value={summary.activeOrders}
          description="Currently in production"
          icon={PlayCircle}
          iconColor="info"
        />

        <DashboardStatCard
          title="Pending Orders"
          value={summary.pendingOrders}
          description="Awaiting production"
          icon={Clock}
          iconColor="warning"
        />

        <DashboardStatCard
          title="Total Items"
          value={summary.totalItems}
          description={`${summary.itemsInProduction} in production`}
          icon={Package}
          iconColor="primary"
        />
        </div>
      </div>

      {/* Quality & Performance Metrics */}
      <div className="dashboard-section">
        <h2 className="section-title">Quality & Performance</h2>
        <div className="dashboard-grid">
          <DashboardStatCard
            title="Quality Pass Rate"
            value={`${quality.qualityRate.toFixed(1)}%`}
            description={`${quality.passedChecks} of ${quality.totalQualityChecks} passed`}
            icon={CheckCircle}
            iconColor="success"
          />

          <DashboardStatCard
            title="On-Time Delivery Rate"
            value={`${performance.onTimeRate.toFixed(1)}%`}
            description="Delivery performance"
            icon={Clock}
            iconColor="success"
          />

          <DashboardStatCard
            title="Capacity Utilization"
            value={`${performance.capacityUtilization.toFixed(1)}%`}
            description="Current capacity"
            icon={Activity}
            iconColor="info"
          />

          <DashboardStatCard
            title="Avg Production Time"
            value={`${performance.avgProductionTime.toFixed(1)} days`}
            description="Per order"
            icon={Clock}
            iconColor="info"
          />
        </div>
      </div>

      {/* Production Status Distribution */}
      <div className="dashboard-section">
        <div className="grid-two-columns">
          <Card>
            <CardHeader>
              <CardTitle>Production Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count }) => `${status}: ${count}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quality Checks Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="quality-stats">
                <div className="quality-stat">
                  <CheckCircle className="icon-lg" style={{ color: '#10b981' }} />
                  <div>
                    <div className="stat-value">{quality.passedChecks}</div>
                    <div className="stat-label">Passed</div>
                  </div>
                </div>
                <div className="quality-stat">
                  <XCircle className="icon-lg" style={{ color: '#ef4444' }} />
                  <div>
                    <div className="stat-value">{quality.failedChecks}</div>
                    <div className="stat-label">Failed</div>
                  </div>
                </div>
                <div className="quality-stat">
                  <BarChart3 className="icon-lg" style={{ color: '#3b82f6' }} />
                  <div>
                    <div className="stat-value">{quality.totalQualityChecks}</div>
                    <div className="stat-label">Total Checks</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Production Trend Chart */}
      <div className="dashboard-section">
        <Card>
          <CardHeader>
            <CardTitle>Production Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={productionTrend}>
                <defs>
                  <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="startedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#completedGradient)"
                  name="Completed"
                />
                <Area
                  type="monotone"
                  dataKey="started"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#startedGradient)"
                  name="Started"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products by Production Volume */}
      <div className="dashboard-section">
        <Card>
          <CardHeader>
            <CardTitle>Top Products by Production Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="products-table">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th className="text-right">Quantity Produced</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((product, index) => (
                    <tr key={product.id}>
                      <td>
                        <div className="product-name">
                          <span className="rank">#{index + 1}</span>
                          {product.name}
                        </div>
                      </td>
                      <td>{product.sku}</td>
                      <td className="table-cell-numeric">{product.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manufacturing Insights */}
      {insights && insights.length > 0 && (
        <div className="dashboard-section">
          <h2 className="section-title">Manufacturing Insights & Recommendations</h2>
          <div className="insights-grid">
            {insights.map((insight, index) => {
              const Icon = INSIGHT_ICONS[insight.type];
              const insightClass = INSIGHT_CLASSES[insight.type];
              return (
                <Card key={index} className={insightClass}>
                  <CardHeader>
                    <div className="insight-header">
                      <CardTitle className="insight-title">{insight.title}</CardTitle>
                      <Icon className="insight-icon" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="insight-description">{insight.description}</p>
                    <Button variant="ghost" size="sm" className="insight-action" asChild>
                      <Link href={insight.actionLink}>
                        {insight.action}
                        <ArrowRight className="icon-xs" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="dashboard-section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions-grid">
          <Button variant="outline" asChild>
            <Link href="/production/ordered-items">
              <Package className="icon-sm" />
              View All Production
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/production/ordered-items?status=pending">
              <Clock className="icon-sm" />
              View Pending Orders
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/production/ordered-items?status=in_progress">
              <PlayCircle className="icon-sm" />
              View Active Production
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboards/analytics">
              <BarChart3 className="icon-sm" />
              View Analytics
            </Link>
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}
