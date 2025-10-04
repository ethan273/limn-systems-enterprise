'use client';

import React from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Briefcase,
  Lightbulb,
  ArrowRight,
  BarChart3,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

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
  const { data: analytics, isLoading } = api.dashboards.getAnalytics.useQuery({
    dateRange: '30d',
  });

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
        <h1 className="dashboard-title">Analytics Dashboard</h1>
        <p className="dashboard-subtitle">
          Comprehensive business performance metrics and trends
        </p>
      </div>

      {/* AI Insights Section */}
      {insights && insights.length > 0 && (
        <div className="space-y-4 mb-6">
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
                        <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Metrics */}
      <div className="dashboard-grid mb-6">
        <Card className="metric-card">
          <CardHeader className="metric-card-header">
            <span className="metric-label">Total Revenue</span>
            <DollarSign className="metric-icon" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="metric-value">${(analytics.summary.totalRevenue / 1000).toFixed(1)}K</div>
            <div className="flex items-center gap-2 mt-2">
              {analytics.summary.revenueGrowth >= 0 ? (
                <TrendingUp className="w-4 h-4 text-success" aria-hidden="true" />
              ) : (
                <TrendingDown className="w-4 h-4 text-destructive" aria-hidden="true" />
              )}
              <p className={`text-xs ${analytics.summary.revenueGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>
                {Math.abs(analytics.summary.revenueGrowth).toFixed(1)}% vs last period
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardHeader className="metric-card-header">
            <span className="metric-label">Total Orders</span>
            <ShoppingCart className="metric-icon" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="metric-value">{analytics.summary.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Avg: ${analytics.summary.avgOrderValue.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardHeader className="metric-card-header">
            <span className="metric-label">Total Customers</span>
            <Users className="metric-icon" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="metric-value">{analytics.summary.totalCustomers}</div>
            <div className="flex items-center gap-2 mt-2">
              {analytics.summary.customerGrowth >= 0 ? (
                <TrendingUp className="w-4 h-4 text-success" aria-hidden="true" />
              ) : (
                <TrendingDown className="w-4 h-4 text-destructive" aria-hidden="true" />
              )}
              <p className={`text-xs ${analytics.summary.customerGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>
                {Math.abs(analytics.summary.customerGrowth).toFixed(1)}% growth
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardHeader className="metric-card-header">
            <span className="metric-label">Active Projects</span>
            <Briefcase className="metric-icon" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="metric-value">{analytics.summary.activeProjects}</div>
            <p className="text-xs text-muted-foreground mt-2">Currently in progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      <Card className="chart-container mb-6">
        <CardHeader className="chart-header">
          <div>
            <h3 className="chart-title">Revenue Trend (Last 12 Months)</h3>
            <p className="chart-description">Monthly revenue and order volume</p>
          </div>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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
            <div className="space-y-3">
              {analytics.topProducts.slice(0, 5).map((product, idx) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-primary-muted flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">#{idx + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">${(product.revenue / 1000).toFixed(1)}K</p>
                    <p className="text-xs text-muted-foreground">{product.quantity} sold</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" aria-hidden="true" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 card rounded-lg border border">
              <div className="text-3xl font-bold text-primary">{analytics.performance.taskCompletionRate.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground mt-1">Task Completion Rate</p>
            </div>
            <div className="text-center p-4 card rounded-lg border border">
              <div className="text-3xl font-bold text-success">{analytics.performance.productionCompletionRate.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground mt-1">Production Completion</p>
            </div>
            <div className="text-center p-4 card rounded-lg border border">
              <div className="text-3xl font-bold text-warning">{analytics.performance.onTimeDeliveryRate.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground mt-1">On-Time Delivery</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
