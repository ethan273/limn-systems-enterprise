'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangeSelector } from '@/components/DateRangeSelector';
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard';
import {
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
            <RefreshCw className="icon-sm" />
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
      <div className="dashboard-section">
        <div className="dashboard-grid">
        <DashboardStatCard
          title="Total Revenue"
          value={`$${summary.totalRevenue.toLocaleString()}`}
          description={`${summary.revenueGrowth >= 0 ? '↑' : '↓'} ${Math.abs(summary.revenueGrowth).toFixed(1)}% vs previous period`}
          icon={DollarSign}
          iconColor="success"
        />

        <DashboardStatCard
          title="Total Orders"
          value={summary.totalOrders.toLocaleString()}
          description={`${summary.orderGrowth >= 0 ? '↑' : '↓'} ${Math.abs(summary.orderGrowth).toFixed(1)}% vs previous period`}
          icon={ShoppingCart}
          iconColor="primary"
        />

        <DashboardStatCard
          title="Avg Order Value"
          value={`$${summary.avgOrderValue.toLocaleString()}`}
          description="Per order"
          icon={ShoppingCart}
          iconColor="info"
        />

        <DashboardStatCard
          title="Active Customers"
          value={summary.activeCustomers.toLocaleString()}
          description={`${summary.newCustomers} new this period`}
          icon={Users}
          iconColor="info"
        />
        </div>
      </div>

      {/* Financial Metrics */}
      <div className="dashboard-section">
        <h2 className="section-title">Financial Performance</h2>
        <div className="dashboard-grid">
          <DashboardStatCard
            title="Total Invoiced"
            value={`$${financial.totalInvoiced.toLocaleString()}`}
            description="Current period"
            icon={DollarSign}
            iconColor="success"
          />

          <DashboardStatCard
            title="Total Paid"
            value={`$${financial.totalPaid.toLocaleString()}`}
            description="Collected"
            icon={CheckCircle}
            iconColor="success"
          />

          <DashboardStatCard
            title="Outstanding A/R"
            value={`$${financial.outstandingAR.toLocaleString()}`}
            description="Pending collection"
            icon={Clock}
            iconColor="warning"
          />

          <DashboardStatCard
            title="Overdue Invoices"
            value={financial.overdueInvoices}
            description="Requires attention"
            icon={AlertTriangle}
            iconColor="destructive"
          />
        </div>
      </div>

      {/* Operations Metrics */}
      <div className="dashboard-section">
        <h2 className="section-title">Operations Performance</h2>
        <div className="dashboard-grid">
          <DashboardStatCard
            title="Active Projects"
            value={operations.activeProjects}
            description={`${operations.completedProjects} completed this period`}
            icon={Briefcase}
            iconColor="primary"
          />

          <DashboardStatCard
            title="Project On-Time Rate"
            value={`${operations.onTimeRate.toFixed(1)}%`}
            description="Delivery performance"
            icon={Target}
            iconColor="success"
          />

          <DashboardStatCard
            title="Overdue Tasks"
            value={operations.overdueTasks}
            description={`${operations.completedTasks} completed this period`}
            icon={AlertTriangle}
            iconColor="warning"
          />

          <DashboardStatCard
            title="Active Production"
            value={operations.activeProduction}
            description={`${operations.completedProduction} completed this period`}
            icon={Package}
            iconColor="primary"
          />

          <DashboardStatCard
            title="Shipments In Transit"
            value={operations.shipmentsInTransit}
            description={`${operations.deliveredShipments} delivered this period`}
            icon={Truck}
            iconColor="info"
          />

          <DashboardStatCard
            title="Delivery On-Time Rate"
            value={`${operations.deliveryOnTimeRate.toFixed(1)}%`}
            description="Shipping performance"
            icon={Target}
            iconColor="success"
          />
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
