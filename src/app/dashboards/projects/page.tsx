'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard';
import {
  Folder,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  PauseCircle,
  Lightbulb,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { ExportPDFButton } from '@/components/ExportPDFButton';
import { DateRangeSelector } from '@/components/DateRangeSelector';
import {
  BarChart,
  Bar,
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
import { getFullName } from '@/lib/utils/name-utils';

// Dynamic route configuration
export const dynamic = 'force-dynamic';

const STATUS_COLORS: Record<string, string> = {
  active: '#10b981',
  planning: '#3b82f6',
  in_progress: '#8b5cf6',
  on_hold: '#f59e0b',
  completed: '#22c55e',
  cancelled: '#ef4444',
};

export default function ProjectDashboardPage() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Fetch projects analytics
  const { data: analytics, isLoading, error } = api.dashboards.getProjectsAnalytics.useQuery(
    { dateRange },
    { refetchInterval: 60000 } // Auto-refresh every 60 seconds
  );

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Fetch AI insights
  const { data: insights } = api.dashboards.getProjectsInsights.useQuery();

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading projects analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-error">
          <AlertTriangle className="error-icon" />
          <h2>Failed to load projects data</h2>
          <p>{error?.message || 'Unable to retrieve projects dashboard data. Please try again.'}</p>
          <Button
            variant="outline"
            onClick={() => utils.dashboards.getProjectsAnalytics.invalidate()}
            className="mt-4"
          >
            <RefreshCw className="icon-sm mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const statusChartData = analytics.statusDistribution.map(item => ({
    name: item.status.replace('_', ' ').toUpperCase(),
    value: item.count,
    percentage: item.percentage.toFixed(1),
  }));

  const priorityChartData = analytics.priorityDistribution.map(item => ({
    name: item.priority.toUpperCase(),
    value: item.count,
  }));

  return (
    <div className="dashboard-page">
      <div id="dashboard-export-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Projects Dashboard</h1>
          <p className="dashboard-subtitle">
            Comprehensive project portfolio analysis and performance tracking
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
            onClick={() => utils.dashboards.getProjectsAnalytics.invalidate()}
            title="Refresh data"
          >
            <RefreshCw className="icon-sm" />
          </Button>
          <ExportPDFButton dashboardName="Projects Dashboard" dateRange={dateRange} />
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
          title="Total Projects"
          value={analytics.summary.total}
          description="Across all statuses"
          icon={Folder}
          iconColor="primary"
        />

        <DashboardStatCard
          title="Active Projects"
          value={analytics.summary.active + analytics.summary.in_progress}
          description="Currently in progress"
          icon={TrendingUp}
          iconColor="primary"
        />

        <DashboardStatCard
          title="Overdue Projects"
          value={analytics.overdueProjects.length}
          description="Require immediate attention"
          icon={AlertTriangle}
          iconColor="destructive"
        />

        <DashboardStatCard
          title="Completed"
          value={analytics.summary.completed}
          description="Successfully finished"
          icon={CheckCircle2}
          iconColor="success"
        />
        </div>
      </div>

      {/* Budget Overview */}
      {analytics.budget.totalAllocated > 0 && (
        <Card className="chart-container mb-6">
          <CardHeader className="chart-header">
            <div>
              <h3 className="chart-title">Budget Overview</h3>
              <p className="chart-description">Project budget allocation and utilization</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="stats-grid">
              <div className="stat-box">
                <div className="stat-value">${(analytics.budget.totalAllocated / 1000000).toFixed(2)}M</div>
                <div className="stat-label">Total Allocated</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">${(analytics.budget.averagePerProject / 1000).toFixed(0)}K</div>
                <div className="stat-label">Average Per Project</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">{analytics.budget.projectsWithBudget}</div>
                <div className="stat-label">Projects with Budget</div>
              </div>
              <div className="stat-box">
                <div className="stat-value">
                  {((analytics.budget.projectsWithBudget / analytics.summary.total) * 100).toFixed(0)}%
                </div>
                <div className="stat-label">Budget Coverage</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Status Distribution Chart */}
        <Card className="chart-container">
          <CardHeader className="chart-header">
            <h3 className="chart-title">Project Status Distribution</h3>
            <p className="chart-description">Projects by current status</p>
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
                        fill={STATUS_COLORS[entry.name.toLowerCase().replace(' ', '_')] || '#94a3b8'}
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

        {/* Priority Distribution Chart */}
        <Card className="chart-container">
          <CardHeader className="chart-header">
            <h3 className="chart-title">Priority Distribution</h3>
            <p className="chart-description">Projects by priority level</p>
          </CardHeader>
          <CardContent>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Projects Alert */}
      {analytics.overdueProjects.length > 0 && (
        <Card className="mb-6 border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
              Overdue Projects ({analytics.overdueProjects.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.overdueProjects.slice(0, 5).map((project) => (
                <div key={project.id} className="flex items-center justify-between p-3 bg-destructive-muted rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{project.name}</p>
                    <p className="text-sm text-muted-foreground">{project.customer}</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-destructive-muted text-destructive border-destructive">
                      {project.daysOverdue} days overdue
                    </Badge>
                  </div>
                </div>
              ))}
              {analytics.overdueProjects.length > 5 && (
                <Link href="/crm/projects?filter=overdue">
                  <Button variant="outline" className="w-full btn-secondary">
                    View All {analytics.overdueProjects.length} Overdue Projects
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Customers by Project Count */}
      {analytics.topCustomers.length > 0 && (
        <Card className="chart-container mb-6">
          <CardHeader className="chart-header">
            <h3 className="chart-title">Top Customers by Project Count</h3>
            <p className="chart-description">Customers with the most projects</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topCustomers.slice(0, 10).map((item: any, idx: number) => (
                <div key={item.customer.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-primary-muted flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">#{idx + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{getFullName(item.customer)}</p>
                      <div className="progress-bar-wrapper mt-1">
                        <div
                          className="progress-bar"
                          style={{
                            width: `${(item.count / analytics.topCustomers[0].count) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="badge-neutral">
                    {item.count} projects
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Health Score */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" aria-hidden="true" />
            Project Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-success-muted rounded-lg border border-success">
              <div className="text-3xl font-bold text-success">{analytics.healthScore.onTime}</div>
              <p className="text-sm text-muted-foreground mt-1">On Time</p>
            </div>
            <div className="text-center p-4 bg-warning-muted rounded-lg border border-warning">
              <div className="text-3xl font-bold text-warning">{analytics.healthScore.atRisk}</div>
              <p className="text-sm text-muted-foreground mt-1">At Risk</p>
            </div>
            <div className="text-center p-4 card rounded-lg border border">
              <div className="text-3xl font-bold">{analytics.healthScore.total}</div>
              <p className="text-sm text-muted-foreground mt-1">Total Active</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="chart-container">
        <CardHeader className="chart-header">
          <h3 className="chart-title">Quick Actions</h3>
          <p className="chart-description">Common project management tasks</p>
        </CardHeader>
        <CardContent>
          <div className="quick-actions-grid">
            <Link href="/crm/projects?status=active">
              <div className="quick-action-button">
                <TrendingUp className="quick-action-icon" aria-hidden="true" />
                <span className="quick-action-label">View Active Projects</span>
              </div>
            </Link>
            <Link href="/crm/projects?filter=overdue">
              <div className="quick-action-button">
                <AlertTriangle className="quick-action-icon" aria-hidden="true" />
                <span className="quick-action-label">Review Overdue</span>
              </div>
            </Link>
            <Link href="/crm/projects?status=on_hold">
              <div className="quick-action-button">
                <PauseCircle className="quick-action-icon" aria-hidden="true" />
                <span className="quick-action-label">On Hold Projects</span>
              </div>
            </Link>
            <Link href="/crm/projects?status=completed">
              <div className="quick-action-button">
                <CheckCircle2 className="quick-action-icon" aria-hidden="true" />
                <span className="quick-action-label">Completed Projects</span>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
