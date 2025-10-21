'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangeSelector } from '@/components/DateRangeSelector';
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  ArrowRight,
  ClipboardCheck,
  RefreshCw,
} from 'lucide-react';
import { ExportPDFButton } from '@/components/ExportPDFButton';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
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

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--muted))'];

export default function QualityDashboardPage() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const { data: quality, isLoading, error } = api.dashboards.getQuality.useQuery(
    { dateRange },
    { refetchInterval: 60000 } // Auto-refresh every 60 seconds
  );

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  const { data: insights } = api.dashboards.getQualityInsights.useQuery();

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading quality dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !quality) {
    return (
      <div className="dashboard-page">
        <PageHeader
          title="Quality Control Dashboard"
          subtitle="Quality inspections, pass rates, and defect analysis"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load quality data"
          description={error?.message || 'Unable to retrieve quality dashboard data. Please try again.'}
          action={{
            label: 'Try Again',
            onClick: () => utils.dashboards.getQuality.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  const { summary, topDefects, inspectionTrend, statusDistribution } = quality;

  return (
    <div className="dashboard-page">
      <div id="dashboard-export-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Quality Control Dashboard</h1>
          <p className="page-subtitle">Quality inspections, pass rates, and defect analysis</p>
        </div>
        <div className="dashboard-actions">
          <DateRangeSelector
            value={dateRange}
            onChange={(value: any) => setDateRange(value)}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => utils.dashboards.getQuality.invalidate()}
            title="Refresh data"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <ExportPDFButton dashboardName="Quality Dashboard" dateRange={dateRange} />
          <Button variant="outline" asChild>
            <Link href="/production/ordered-items">
              <ClipboardCheck className="icon-sm" />
              View Inspections
            </Link>
          </Button>
        </div>
      </div>

      {/* Inspection Summary Metrics */}
      <div className="dashboard-section">
        <h2 className="section-title">Inspection Overview</h2>
        <div className="dashboard-grid">
          <DashboardStatCard
            title="Total Inspections"
            value={summary.totalInspections}
            description={`${summary.newInspections} this period`}
            icon={ClipboardCheck}
            iconColor="primary"
          />

          <DashboardStatCard
            title="Passed"
            value={summary.passedInspections}
            description="Quality approved"
            icon={CheckCircle}
            iconColor="success"
          />

          <DashboardStatCard
            title="Failed"
            value={summary.failedInspections}
            description="Requires rework"
            icon={XCircle}
            iconColor="destructive"
          />

          <DashboardStatCard
            title="Pending"
            value={summary.pendingInspections}
            description="Awaiting inspection"
            icon={Clock}
            iconColor="warning"
          />
        </div>
      </div>

      {/* Quality Performance Metrics */}
      <div className="dashboard-section">
        <h2 className="section-title">Quality Performance</h2>
        <div className="dashboard-grid">
          <DashboardStatCard
            title="Pass Rate"
            value={`${summary.passRate.toFixed(1)}%`}
            description={summary.passRate >= 90 ? 'Above target' : 'Below target (90%)'}
            icon={summary.passRate >= 90 ? TrendingUp : TrendingDown}
            iconColor={summary.passRate >= 90 ? 'success' : 'warning'}
          />

          <DashboardStatCard
            title="Fail Rate"
            value={`${summary.failRate.toFixed(1)}%`}
            description={summary.failRate <= 10 ? 'Within target' : 'Exceeds target (10%)'}
            icon={summary.failRate <= 10 ? TrendingUp : TrendingDown}
            iconColor={summary.failRate <= 10 ? 'success' : 'warning'}
          />
        </div>
      </div>

      {/* Inspection Trend Chart */}
      <div className="dashboard-section">
        <Card>
          <CardHeader>
            <CardTitle>Inspection Trend (Passed vs Failed)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={inspectionTrend}>
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
                <Line type="monotone" dataKey="passed" stroke="hsl(var(--primary))" strokeWidth={2} name="Passed" />
                <Line type="monotone" dataKey="failed" stroke="hsl(var(--destructive))" strokeWidth={2} name="Failed" />
                <Line type="monotone" dataKey="total" stroke="hsl(var(--muted-foreground))" strokeWidth={2} name="Total" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution and Top Defects */}
      <div className="dashboard-section">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Inspection Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.status}: ${entry.count}`}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Defect Categories Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Top Defect Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {topDefects.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topDefects}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="category"
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
                    <Bar dataKey="count" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <p>No defects recorded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quality Insights */}
      {insights && insights.length > 0 && (
        <div className="dashboard-section">
          <h2 className="section-title">Quality Insights & Recommendations</h2>
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
              <ClipboardCheck className="icon-sm" />
              View All Inspections
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/production/ordered-items">
              <CheckCircle className="icon-sm" />
              View Passed
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/production/ordered-items">
              <XCircle className="icon-sm" />
              View Failed
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/production/ordered-items">
              <Clock className="icon-sm" />
              View Pending
            </Link>
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}
