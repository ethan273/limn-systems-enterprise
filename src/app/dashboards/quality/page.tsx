'use client';

import React from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';
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
  const { data: quality, isLoading } = api.dashboards.getQuality.useQuery({
    dateRange: '30d',
  });

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

  if (!quality) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-error">
          <AlertTriangle className="error-icon" />
          <p>Failed to load quality data</p>
        </div>
      </div>
    );
  }

  const { summary, topDefects, inspectionTrend, statusDistribution } = quality;

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Quality Control Dashboard</h1>
          <p className="page-subtitle">Quality inspections, pass rates, and defect analysis</p>
        </div>
        <div className="dashboard-actions">
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
        <div className="metrics-grid">
          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Total Inspections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{summary.totalInspections}</div>
              <div className="metric-subtext">
                <ClipboardCheck className="icon-xs" />
                <span>{summary.newInspections} this period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Passed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{summary.passedInspections}</div>
              <div className="metric-subtext">
                <CheckCircle className="icon-xs" />
                <span>Quality approved</span>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{summary.failedInspections}</div>
              <div className="metric-subtext">
                <XCircle className="icon-xs" />
                <span>Requires rework</span>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{summary.pendingInspections}</div>
              <div className="metric-subtext">
                <Clock className="icon-xs" />
                <span>Awaiting inspection</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quality Performance Metrics */}
      <div className="dashboard-section">
        <h2 className="section-title">Quality Performance</h2>
        <div className="metrics-grid-2col">
          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Pass Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{summary.passRate.toFixed(1)}%</div>
              <div className={summary.passRate >= 90 ? 'metric-change-positive' : 'metric-change-negative'}>
                {summary.passRate >= 90 ? (
                  <TrendingUp className="icon-xs" />
                ) : (
                  <TrendingDown className="icon-xs" />
                )}
                <span>{summary.passRate >= 90 ? 'Above target' : 'Below target (90%)'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Fail Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{summary.failRate.toFixed(1)}%</div>
              <div className={summary.failRate <= 10 ? 'metric-change-positive' : 'metric-change-negative'}>
                {summary.failRate <= 10 ? (
                  <TrendingUp className="icon-xs" />
                ) : (
                  <TrendingDown className="icon-xs" />
                )}
                <span>{summary.failRate <= 10 ? 'Within target' : 'Exceeds target (10%)'}</span>
              </div>
            </CardContent>
          </Card>
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
  );
}
