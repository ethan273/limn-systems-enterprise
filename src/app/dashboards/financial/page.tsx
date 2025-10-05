'use client';

import React from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';
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
  const { data: financial, isLoading } = api.dashboards.getFinancial.useQuery({
    dateRange: '30d',
  });

  const { data: insights } = api.dashboards.getFinancialInsights.useQuery();

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

  if (!financial) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-error">
          <AlertTriangle className="error-icon" />
          <p>Failed to load financial data</p>
        </div>
      </div>
    );
  }

  const { summary, invoices, cashFlowTrend, invoiceStatusDistribution, paymentMethods, topExpenseCategories, topCustomers } = financial;

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Financial Operations Dashboard</h1>
          <p className="page-subtitle">Revenue, expenses, cash flow, and financial metrics</p>
        </div>
        <div className="dashboard-actions">
          <Button variant="outline" asChild>
            <Link href="/financials/invoices">
              <FileText className="icon-sm" />
              View Invoices
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="metrics-grid">
        <Card className="metric-card">
          <CardHeader>
            <CardTitle className="metric-label">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="metric-value">${summary.totalRevenue.toLocaleString()}</div>
            <div className="metric-subtext">
              <DollarSign className="icon-xs" />
              <span>Collected this period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardHeader>
            <CardTitle className="metric-label">Total Invoiced</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="metric-value">${summary.totalInvoiced.toLocaleString()}</div>
            <div className="metric-subtext">
              <FileText className="icon-xs" />
              <span>{invoices.total} invoices</span>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardHeader>
            <CardTitle className="metric-label">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="metric-value">${summary.totalExpenses.toLocaleString()}</div>
            <div className="metric-subtext">
              <TrendingDown className="icon-xs" />
              <span>Period expenses</span>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardHeader>
            <CardTitle className="metric-label">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="metric-value">${summary.profit.toLocaleString()}</div>
            <div className={summary.profitMargin >= 0 ? 'metric-change-positive' : 'metric-change-negative'}>
              {summary.profitMargin >= 0 ? (
                <TrendingUp className="icon-xs" />
              ) : (
                <TrendingDown className="icon-xs" />
              )}
              <span>{Math.abs(summary.profitMargin).toFixed(1)}% profit margin</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice & AR Metrics */}
      <div className="dashboard-section">
        <h2 className="section-title">Accounts Receivable & Invoices</h2>
        <div className="metrics-grid">
          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Total A/R</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">${invoices.totalAR.toLocaleString()}</div>
              <div className="metric-subtext">
                <Clock className="icon-xs" />
                <span>Outstanding receivables</span>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Paid Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{invoices.paid}</div>
              <div className="metric-subtext">
                <CheckCircle className="icon-xs" />
                <span>${summary.totalPaid.toLocaleString()} paid</span>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Pending Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{invoices.pending}</div>
              <div className="metric-subtext">
                <Clock className="icon-xs" />
                <span>${summary.totalPending.toLocaleString()} pending</span>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Overdue Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{invoices.overdue}</div>
              <div className="metric-subtext">
                <AlertTriangle className="icon-xs" />
                <span>${summary.totalOverdue.toLocaleString()} overdue</span>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Avg Invoice Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">${invoices.avgInvoiceValue.toLocaleString()}</div>
              <div className="metric-subtext">
                <FileText className="icon-xs" />
                <span>Per invoice</span>
              </div>
            </CardContent>
          </Card>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <div className="space-y-4">
              {topCustomers.map((customer, index) => (
                <div key={customer.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">Customer ID: {customer.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">${customer.revenue.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total revenue</p>
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
  );
}
