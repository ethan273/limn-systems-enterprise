'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangeSelector } from '@/components/DateRangeSelector';
import { ExportPDFButton } from '@/components/ExportPDFButton';
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  PieChart,
  Users,
  ArrowRight,
  Lightbulb,
  RefreshCw,
} from 'lucide-react';
import { getFullName } from '@/lib/utils/name-utils';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
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

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

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

export default function FinancialDashboardPage() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');

  const { data: financial, isLoading, error } = api.dashboards.getFinancial.useQuery(
    { dateRange },
    {
      refetchInterval: 60000, // Auto-refresh every 60 seconds
    }
  );

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  const { data: insights } = api.dashboards.getFinancialInsights.useQuery(undefined, {
    refetchInterval: 60000, // Auto-refresh every 60 seconds
  });

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading financial dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !financial) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-error">
          <AlertTriangle className="error-icon" />
          <h2>Failed to load financial data</h2>
          <p>{error?.message || 'Unable to retrieve financial dashboard data. Please try again.'}</p>
          <Button
            variant="outline"
            onClick={() => utils.dashboards.getFinancial.invalidate()}
            className="mt-4"
          >
            <RefreshCw className="icon-sm mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const { summary, invoices, cashFlowTrend, invoiceStatusDistribution, paymentMethods, topExpenseCategories, topCustomers } = financial;

  return (
    <div className="dashboard-page">
      <div id="dashboard-export-container">
        {/* Header */}
        <div className="dashboard-header">
        <div>
          <h1 className="page-title">Financial Operations Dashboard</h1>
          <p className="page-subtitle">Revenue, expenses, cash flow, and financial metrics</p>
        </div>
        <div className="dashboard-actions">
          <DateRangeSelector value={dateRange} onChange={(value: any) => setDateRange(value)} />
          <Button variant="outline" size="icon" onClick={() => utils.dashboards.getFinancial.invalidate()} title="Refresh data">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <ExportPDFButton dashboardName="Financial Operations Dashboard" dateRange={dateRange} />
          <Button variant="outline" asChild>
            <Link href="/financials/invoices">
              <FileText className="icon-sm" />
              View Invoices
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="dashboard-section">
        <div className="dashboard-grid">
        <DashboardStatCard
          title="Total Revenue"
          value={`$${summary.totalRevenue.toLocaleString()}`}
          description="Collected this period"
          icon={DollarSign}
          iconColor="success"
        />

        <DashboardStatCard
          title="Total Invoiced"
          value={`$${summary.totalInvoiced.toLocaleString()}`}
          description={`${invoices.total} invoices`}
          icon={FileText}
          iconColor="primary"
        />

        <DashboardStatCard
          title="Total Expenses"
          value={`$${summary.totalExpenses.toLocaleString()}`}
          description="Period expenses"
          icon={TrendingDown}
          iconColor="destructive"
        />

        <DashboardStatCard
          title="Net Profit"
          value={`$${summary.profit.toLocaleString()}`}
          description={`${summary.profitMargin >= 0 ? '↑' : '↓'} ${Math.abs(summary.profitMargin).toFixed(1)}% profit margin`}
          icon={summary.profitMargin >= 0 ? TrendingUp : TrendingDown}
          iconColor={summary.profitMargin >= 0 ? 'success' : 'destructive'}
        />
        </div>
      </div>

      {/* Invoice & AR Metrics */}
      <div className="dashboard-section">
        <h2 className="section-title">Accounts Receivable & Invoices</h2>
        <div className="dashboard-grid">
          <DashboardStatCard
            title="Total A/R"
            value={`$${invoices.totalAR.toLocaleString()}`}
            description="Outstanding receivables"
            icon={Clock}
            iconColor="warning"
          />

          <DashboardStatCard
            title="Paid Invoices"
            value={invoices.paid}
            description={`$${summary.totalPaid.toLocaleString()} paid`}
            icon={CheckCircle}
            iconColor="success"
          />

          <DashboardStatCard
            title="Pending Invoices"
            value={invoices.pending}
            description={`$${summary.totalPending.toLocaleString()} pending`}
            icon={Clock}
            iconColor="warning"
          />

          <DashboardStatCard
            title="Overdue Invoices"
            value={invoices.overdue}
            description={`$${summary.totalOverdue.toLocaleString()} overdue`}
            icon={AlertTriangle}
            iconColor="destructive"
          />

          <DashboardStatCard
            title="Avg Invoice Value"
            value={`$${invoices.avgInvoiceValue.toLocaleString()}`}
            description="Per invoice"
            icon={FileText}
            iconColor="info"
          />
        </div>
      </div>

      {/* Cash Flow Trend */}
      <div className="dashboard-section">
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow Trend (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={cashFlowTrend}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
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
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                  name="Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  fill="url(#expenseGradient)"
                  name="Expenses"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Status & Payment Methods */}
      <div className="dashboard-section">
        <div className="grid-two-columns">
          {/* Invoice Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={invoiceStatusDistribution}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.status}: ${entry.count}`}
                  >
                    {invoiceStatusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string, props: any) => [
                      `${value} invoices ($${props.payload.amount.toLocaleString()})`,
                      props.payload.status,
                    ]}
                  />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={paymentMethods}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="method"
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
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Top Expense Categories */}
      <div className="dashboard-section">
        <Card>
          <CardHeader>
            <CardTitle>Top Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topExpenseCategories} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  type="number"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                  width={150}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
                />
                <Bar dataKey="amount" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers by Revenue */}
      <div className="dashboard-section">
        <Card>
          <CardHeader>
            <CardTitle>Top Customers by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="customer-list">
              {topCustomers.map((customer, index) => (
                <div key={customer.id} className="customer-list-item">
                  <div className="customer-rank">
                    <div className="customer-rank-badge">
                      {index + 1}
                    </div>
                    <div className="customer-info">
                      <p className="customer-name">{getFullName(customer)}</p>
                    </div>
                  </div>
                  <div className="customer-revenue">
                    <p className="customer-revenue-amount">${customer.revenue.toLocaleString()}</p>
                    <p className="customer-revenue-label">Total revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Insights */}
      {insights && insights.length > 0 && (
        <div className="dashboard-section">
          <h2 className="section-title">Financial Insights & Recommendations</h2>
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
            <Link href="/financials/invoices">
              <FileText className="icon-sm" />
              View All Invoices
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/financials/payments">
              <CreditCard className="icon-sm" />
              View Payments
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/financials/expenses">
              <TrendingDown className="icon-sm" />
              View Expenses
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/crm/customers">
              <Users className="icon-sm" />
              View Customers
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboards/analytics">
              <PieChart className="icon-sm" />
              View Analytics
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboards/executive">
              <DollarSign className="icon-sm" />
              View Executive Dashboard
            </Link>
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}
