'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangeSelector } from '@/components/DateRangeSelector';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Briefcase,
  Package,
  Truck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Lightbulb,
  ArrowRight,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { ExportPDFButton } from '@/components/ExportPDFButton';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Dynamic route configuration
export const dynamic = 'force-dynamic';

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

export default function ExecutiveDashboardPage() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');

  const { data: executive, isLoading, refetch } = api.dashboards.getExecutive.useQuery(
    { dateRange },
    { refetchInterval: 60000 } // Auto-refresh every 60 seconds
  );

  const { data: insights } = api.dashboards.getExecutiveInsights.useQuery();

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading executive dashboard...</p>
        </div>
      </div>
    );
  }

  if (!executive) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-error">
          <AlertTriangle className="error-icon" />
          <p>Failed to load executive data</p>
        </div>
      </div>
    );
  }

  const { summary, financial, operations, revenueTrend, departments } = executive;

  return (
    <div className="dashboard-page">
      <div id="dashboard-export-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Executive Dashboard</h1>
          <p className="page-subtitle">High-level business metrics and strategic KPIs</p>
        </div>
        <div className="dashboard-actions">
          <DateRangeSelector
            value={dateRange}
            onChange={(value: any) => setDateRange(value)}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            title="Refresh data"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <ExportPDFButton dashboardName="Executive Dashboard" dateRange={dateRange} />
          <Button variant="outline" asChild>
            <Link href="/dashboards/analytics">
              <BarChart3 className="icon-sm" />
              View Analytics
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Performance Metrics */}
      <div className="dashboard-grid">
        <Card className="metric-card">
          <CardHeader>
            <CardTitle className="metric-label">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="metric-value">${summary.totalRevenue.toLocaleString()}</div>
            <div className={summary.revenueGrowth >= 0 ? 'metric-change-positive' : 'metric-change-negative'}>
              {summary.revenueGrowth >= 0 ? (
                <TrendingUp className="icon-xs" />
              ) : (
                <TrendingDown className="icon-xs" />
              )}
              <span>{Math.abs(summary.revenueGrowth).toFixed(1)}% vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardHeader>
            <CardTitle className="metric-label">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="metric-value">{summary.totalOrders.toLocaleString()}</div>
            <div className={summary.orderGrowth >= 0 ? 'metric-change-positive' : 'metric-change-negative'}>
              {summary.orderGrowth >= 0 ? (
                <TrendingUp className="icon-xs" />
              ) : (
                <TrendingDown className="icon-xs" />
              )}
              <span>{Math.abs(summary.orderGrowth).toFixed(1)}% vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardHeader>
            <CardTitle className="metric-label">Avg Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="metric-value">${summary.avgOrderValue.toLocaleString()}</div>
            <div className="metric-subtext">
              <ShoppingCart className="icon-xs" />
              <span>Per order</span>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardHeader>
            <CardTitle className="metric-label">Active Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="metric-value">{summary.activeCustomers.toLocaleString()}</div>
            <div className="metric-subtext">
              <Users className="icon-xs" />
              <span>{summary.newCustomers} new this period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Metrics */}
      <div className="dashboard-section">
        <h2 className="section-title">Financial Performance</h2>
        <div className="dashboard-grid">
          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Total Invoiced</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">${financial.totalInvoiced.toLocaleString()}</div>
              <div className="metric-subtext">
                <DollarSign className="icon-xs" />
                <span>Current period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Total Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">${financial.totalPaid.toLocaleString()}</div>
              <div className="metric-subtext">
                <CheckCircle className="icon-xs" />
                <span>Collected</span>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Outstanding A/R</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">${financial.outstandingAR.toLocaleString()}</div>
              <div className="metric-subtext">
                <Clock className="icon-xs" />
                <span>Pending collection</span>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Overdue Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{financial.overdueInvoices}</div>
              <div className="metric-subtext">
                <AlertTriangle className="icon-xs" />
                <span>Requires attention</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Operations Metrics */}
      <div className="dashboard-section">
        <h2 className="section-title">Operations Performance</h2>
        <div className="dashboard-grid">
          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Active Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{operations.activeProjects}</div>
              <div className="metric-subtext">
                <Briefcase className="icon-xs" />
                <span>{operations.completedProjects} completed this period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Project On-Time Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{operations.onTimeRate.toFixed(1)}%</div>
              <div className="metric-subtext">
                <Target className="icon-xs" />
                <span>Delivery performance</span>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Overdue Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{operations.overdueTasks}</div>
              <div className="metric-subtext">
                <AlertTriangle className="icon-xs" />
                <span>{operations.completedTasks} completed this period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Active Production</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{operations.activeProduction}</div>
              <div className="metric-subtext">
                <Package className="icon-xs" />
                <span>{operations.completedProduction} completed this period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Shipments In Transit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{operations.shipmentsInTransit}</div>
              <div className="metric-subtext">
                <Truck className="icon-xs" />
                <span>{operations.deliveredShipments} delivered this period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Delivery On-Time Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{operations.deliveryOnTimeRate.toFixed(1)}%</div>
              <div className="metric-subtext">
                <Target className="icon-xs" />
                <span>Shipping performance</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="dashboard-section">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
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
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Department Performance */}
      <div className="dashboard-section">
        <Card>
          <CardHeader>
            <CardTitle>Department Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departments}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
                <Legend />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Actual Revenue" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" fill="hsl(var(--muted))" name="Target Revenue" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Insights */}
      {insights && insights.length > 0 && (
        <div className="dashboard-section">
          <h2 className="section-title">Strategic Insights & Recommendations</h2>
          <div className="insights-grid">
            {insights.map((insight, index) => {
              const Icon = INSIGHT_ICONS[insight.type];
              const insightClass = INSIGHT_CLASSES[insight.type];
              return (
                <Card key={index} className={insightClass}>
                  <CardHeader>
                    <div className="insight-header">
                      <Icon className="insight-icon" />
                      <CardTitle className="insight-title">{insight.title}</CardTitle>
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
            <Link href="/dashboards/analytics">
              <BarChart3 className="icon-sm" />
              View Analytics Dashboard
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboards/projects">
              <Briefcase className="icon-sm" />
              View Projects Dashboard
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/financials/invoices">
              <DollarSign className="icon-sm" />
              View Invoices
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/crm/customers">
              <Users className="icon-sm" />
              View Customers
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/production/ordered-items">
              <Package className="icon-sm" />
              View Production
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/shipping/shipments">
              <Truck className="icon-sm" />
              View Shipments
            </Link>
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}
