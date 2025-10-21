'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard';
import { DateRangeSelector } from '@/components/DateRangeSelector';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Briefcase,
  Lightbulb,
  ArrowRight,
  BarChart3,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import {
  LazyRechartsPie as PieChart,
  LazyPie as Pie,
  LazyCell as Cell,
  LazyXAxis as XAxis,
  LazyYAxis as YAxis,
  LazyCartesianGrid as CartesianGrid,
  LazyTooltip as Tooltip,
  LazyLegend as Legend,
  LazyResponsiveContainer as ResponsiveContainer,
  LazyArea as Area,
  LazyRechartsArea as AreaChart,
} from '@/components/lazy';

// Dynamic route configuration
export const dynamic = 'force-dynamic';

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  shipped: '#8b5cf6',
  delivered: '#10b981',
  cancelled: '#ef4444',
};

export default function AnalyticsDashboardPage() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'year' | 'all'>('30d');

  const { data: analytics, isLoading, error } = api.dashboards.getAnalytics.useQuery(
    { dateRange },
    { refetchInterval: 60000 } // Auto-refresh every 60 seconds
  );

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  const { data: insights } = api.dashboards.getAnalyticsInsights.useQuery();

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <PageHeader
          title="Analytics Dashboard"
          subtitle="Comprehensive business performance metrics and trends"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load analytics data"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.dashboards.getAnalytics.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-empty-state">
          <BarChart3 className="dashboard-empty-icon" aria-hidden="true" />
          <h2 className="dashboard-empty-title">No Analytics Data</h2>
          <p className="dashboard-empty-description">
            Unable to load analytics. Please try again.
          </p>
        </div>
      </div>
    );
  }

  const statusChartData = analytics.orderStatusDistribution.map(item => ({
    name: item.status.toUpperCase(),
    value: item.count,
    percentage: item.percentage.toFixed(1),
  }));

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Analytics Dashboard</h1>
          <p className="dashboard-subtitle">
            Comprehensive business performance metrics and trends
          </p>
        </div>
        <div className="dashboard-actions">
          <DateRangeSelector
            value={dateRange}
            onChange={(value: any) => setDateRange(value)}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => utils.dashboards.getAnalytics.invalidate()}
            title="Refresh data"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* AI Insights Section */}
      {insights && insights.length > 0 && (
        <div className="dashboard-section">
          <div className="insights-grid">
          {insights.map((insight, idx) => (
            <div key={idx} className="insight-card">
              <Lightbulb className="insight-icon" aria-hidden="true" />
              <div className="insight-content">
                <h3 className="insight-title">{insight.title}</h3>
                <p className="insight-description">{insight.description}</p>
                {insight.actionLink && (
                  <div className="insight-actions">
                    <Link href={insight.actionLink}>
                      <Button size="sm" variant="outline" className="btn-secondary">
                        {insight.action}
                        <ArrowRight className="icon-sm" aria-hidden="true" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="dashboard-section">
        <div className="dashboard-grid">
        <DashboardStatCard
          title="Total Revenue"
          value={`$${(analytics.summary.totalRevenue / 1000).toFixed(1)}K`}
          description={`${analytics.summary.revenueGrowth >= 0 ? '↑' : '↓'} ${Math.abs(analytics.summary.revenueGrowth).toFixed(1)}% vs last period`}
          icon={DollarSign}
          iconColor="success"
        />

        <DashboardStatCard
          title="Total Orders"
          value={analytics.summary.totalOrders}
          description={`Avg: $${analytics.summary.avgOrderValue.toFixed(2)}`}
          icon={ShoppingCart}
          iconColor="primary"
        />

        <DashboardStatCard
          title="Total Customers"
          value={analytics.summary.totalCustomers}
          description={`${analytics.summary.customerGrowth >= 0 ? '↑' : '↓'} ${Math.abs(analytics.summary.customerGrowth).toFixed(1)}% growth`}
          icon={Users}
          iconColor="info"
        />

        <DashboardStatCard
          title="Active Projects"
          value={analytics.summary.activeProjects}
          description="Currently in progress"
          icon={Briefcase}
          iconColor="primary"
        />
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="dashboard-section" data-testid="revenue-chart">
        <Card className="chart-container">
        <CardHeader className="chart-header">
          <div>
            <h3 className="chart-title">Revenue Trend (Last 12 Months)</h3>
            <p className="chart-description">Monthly revenue and order volume</p>
          </div>
        </CardHeader>
        <CardContent>
          {analytics.revenueByMonth && analytics.revenueByMonth.length > 0 ? (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.revenueByMonth}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name="Revenue ($)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          ) : (
            <div className="dashboard-empty-state">
              <BarChart3 className="dashboard-empty-icon" aria-hidden="true" />
              <p className="dashboard-empty-description">No revenue data available for the selected period</p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Charts Row */}
      <div className="dashboard-section">
        <div className="grid-two-columns">
        {/* Order Status Distribution */}
        <Card className="chart-container">
          <CardHeader className="chart-header">
            <h3 className="chart-title">Order Status Distribution</h3>
            <p className="chart-description">Orders by current status</p>
          </CardHeader>
          <CardContent>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={entry => `${entry.name}: ${entry.percentage}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.name.toLowerCase()] || '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="chart-container">
          <CardHeader className="chart-header">
            <h3 className="chart-title">Top Products by Revenue</h3>
            <p className="chart-description">Best performing products</p>
          </CardHeader>
          <CardContent>
            <div className="product-list">
              {analytics.topProducts.slice(0, 5).map((product, idx) => (
                <div key={product.id} className="product-list-item">
                  <div className="product-rank-section">
                    <div className="product-rank-badge">
                      <span className="product-rank-number">#{idx + 1}</span>
                    </div>
                    <div className="product-info">
                      <p className="product-name">{product.name}</p>
                      <p className="product-sku">{product.sku}</p>
                    </div>
                  </div>
                  <div className="product-revenue-section">
                    <p className="product-revenue-amount">${(product.revenue / 1000).toFixed(1)}K</p>
                    <p className="product-revenue-label">{product.quantity} sold</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="dashboard-section" data-testid="production-metrics">
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="icon-sm" aria-hidden="true" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.performance ? (
          <div className="grid-three-columns">
            <div className="performance-stat">
              <div className="performance-stat-value text-primary">{analytics.performance.taskCompletionRate.toFixed(1)}%</div>
              <p className="performance-stat-label">Task Completion Rate</p>
            </div>
            <div className="performance-stat">
              <div className="performance-stat-value text-success">{analytics.performance.productionCompletionRate.toFixed(1)}%</div>
              <p className="performance-stat-label">Production Completion</p>
            </div>
            <div className="performance-stat">
              <div className="performance-stat-value text-warning">{analytics.performance.onTimeDeliveryRate.toFixed(1)}%</div>
              <p className="performance-stat-label">On-Time Delivery</p>
            </div>
          </div>
          ) : (
            <div className="dashboard-empty-state">
              <Package className="dashboard-empty-icon" aria-hidden="true" />
              <p className="dashboard-empty-description">No performance data available</p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Quality Metrics */}
      <div className="dashboard-section" data-testid="quality-metrics">
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="icon-sm" aria-hidden="true" />
            Quality Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="dashboard-empty-state">
            <Package className="dashboard-empty-icon" aria-hidden="true" />
            <p className="dashboard-empty-description">Quality metrics coming soon</p>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Inventory Overview */}
      <div className="dashboard-section" data-testid="inventory">
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="icon-sm" aria-hidden="true" />
            Inventory Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.topProducts && analytics.topProducts.length > 0 ? (
          <div className="grid-three-columns">
            <div className="performance-stat">
              <div className="performance-stat-value text-primary">{analytics.summary.totalProducts}</div>
              <p className="performance-stat-label">Total Products</p>
            </div>
            <div className="performance-stat">
              <div className="performance-stat-value text-success">{analytics.topProducts.length}</div>
              <p className="performance-stat-label">Top Sellers</p>
            </div>
            <div className="performance-stat">
              <div className="performance-stat-value text-warning">—</div>
              <p className="performance-stat-label">Low Stock Items</p>
            </div>
          </div>
          ) : (
            <div className="dashboard-empty-state">
              <Package className="dashboard-empty-icon" aria-hidden="true" />
              <p className="dashboard-empty-description">No inventory data available</p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Quick Actions */}
      <Card className="chart-container">
        <CardHeader className="chart-header">
          <h3 className="chart-title">Quick Actions</h3>
          <p className="chart-description">Common analytics tasks</p>
        </CardHeader>
        <CardContent>
          <div className="quick-actions-grid">
            <Link href="/orders">
              <div className="quick-action-button">
                <ShoppingCart className="quick-action-icon" aria-hidden="true" />
                <span className="quick-action-label">View All Orders</span>
              </div>
            </Link>
            <Link href="/crm/customers">
              <div className="quick-action-button">
                <Users className="quick-action-icon" aria-hidden="true" />
                <span className="quick-action-label">Customer List</span>
              </div>
            </Link>
            <Link href="/products/catalog">
              <div className="quick-action-button">
                <Package className="quick-action-icon" aria-hidden="true" />
                <span className="quick-action-label">Product Catalog</span>
              </div>
            </Link>
            <Link href="/crm/projects">
              <div className="quick-action-button">
                <Briefcase className="quick-action-icon" aria-hidden="true" />
                <span className="quick-action-label">All Projects</span>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
