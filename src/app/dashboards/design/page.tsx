'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangeSelector } from '@/components/DateRangeSelector';
import {
  FileText,
  FilePlus,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  FolderOpen,
  GitBranch,
  Lightbulb,
  ArrowRight,
  RefreshCw,
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

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--destructive))'];

export default function DesignDashboardPage() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');

  const { data: design, isLoading, refetch } = api.dashboards.getDesign.useQuery(
    { dateRange },
    { refetchInterval: 60000 } // Auto-refresh every 60 seconds
  );

  const { data: insights } = api.dashboards.getDesignInsights.useQuery();

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading design dashboard...</p>
        </div>
      </div>
    );
  }

  if (!design) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-error">
          <AlertTriangle className="error-icon" />
          <p>Failed to load design data</p>
        </div>
      </div>
    );
  }

  const { summary, shopDrawings, projects, designActivityTrend, fileStatusDistribution, revisionStatusDistribution } = design;

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Design & Creative Dashboard</h1>
          <p className="page-subtitle">Design files, revisions, and shop drawings metrics</p>
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
          <Button variant="outline" asChild>
            <Link href="/design/files">
              <FolderOpen className="icon-sm" />
              View Design Files
            </Link>
          </Button>
        </div>
      </div>

      {/* Design Files Metrics */}
      <div className="dashboard-section">
        <h2 className="section-title">Design Files</h2>
        <div className="dashboard-grid">
          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Total Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{summary.totalDesignFiles}</div>
              <div className="metric-subtext">
                <FileText className="icon-xs" />
                <span>{summary.newDesignFiles} new this period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Active Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{summary.activeDesignFiles}</div>
              <div className="metric-subtext">
                <Clock className="icon-xs" />
                <span>In progress</span>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Approved Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{summary.approvedDesignFiles}</div>
              <div className="metric-subtext">
                <CheckCircle className="icon-xs" />
                <span>Completed</span>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Avg Revisions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{summary.avgRevisionsPerFile}</div>
              <div className="metric-subtext">
                <GitBranch className="icon-xs" />
                <span>Per design file</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Design Revisions Metrics */}
      <div className="dashboard-section">
        <h2 className="section-title">Design Revisions</h2>
        <div className="dashboard-grid">
          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Total Revisions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{summary.totalRevisions}</div>
              <div className="metric-subtext">
                <GitBranch className="icon-xs" />
                <span>{summary.recentRevisions} this period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Pending Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{summary.pendingReviews}</div>
              <div className="metric-subtext">
                <Clock className="icon-xs" />
                <span>Awaiting review</span>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Approved Revisions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{summary.approvedRevisions}</div>
              <div className="metric-subtext">
                <CheckCircle className="icon-xs" />
                <span>Completed</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Shop Drawings Metrics */}
      <div className="dashboard-section">
        <h2 className="section-title">Shop Drawings</h2>
        <div className="dashboard-grid">
          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Total Drawings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{shopDrawings.total}</div>
              <div className="metric-subtext">
                <FileText className="icon-xs" />
                <span>{shopDrawings.new} new this period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{shopDrawings.pending}</div>
              <div className="metric-subtext">
                <Clock className="icon-xs" />
                <span>Awaiting approval</span>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{shopDrawings.approved}</div>
              <div className="metric-subtext">
                <CheckCircle className="icon-xs" />
                <span>Ready for production</span>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Approval Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{shopDrawings.approvalRate.toFixed(1)}%</div>
              <div className="metric-subtext">
                <TrendingUp className="icon-xs" />
                <span>{shopDrawings.rejected} rejected</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Project Design Coverage */}
      <div className="dashboard-section">
        <h2 className="section-title">Project Coverage</h2>
        <div className="dashboard-grid">
          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Total Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{projects.total}</div>
              <div className="metric-subtext">
                <FolderOpen className="icon-xs" />
                <span>Active projects</span>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Projects with Design</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{projects.withDesign}</div>
              <div className="metric-subtext">
                <FileText className="icon-xs" />
                <span>Have design files</span>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Design Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{projects.designCoverage.toFixed(1)}%</div>
              <div className="metric-subtext">
                <TrendingUp className="icon-xs" />
                <span>Coverage rate</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Design Activity Trend */}
      <div className="dashboard-section">
        <Card>
          <CardHeader>
            <CardTitle>Design Activity Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={designActivityTrend}>
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
                <Line type="monotone" dataKey="files" stroke="hsl(var(--primary))" strokeWidth={2} name="Design Files" />
                <Line type="monotone" dataKey="revisions" stroke="hsl(var(--secondary))" strokeWidth={2} name="Revisions" />
                <Line type="monotone" dataKey="shopDrawings" stroke="hsl(var(--accent))" strokeWidth={2} name="Shop Drawings" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution Charts */}
      <div className="dashboard-section">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* File Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>File Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={fileStatusDistribution}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry) => `${entry.status}: ${entry.count}`}
                  >
                    {fileStatusDistribution.map((entry, index) => (
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

          {/* Revision Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Revision Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revisionStatusDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="status"
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
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Design Insights */}
      {insights && insights.length > 0 && (
        <div className="dashboard-section">
          <h2 className="section-title">Design Insights & Recommendations</h2>
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
            <Link href="/design/files">
              <FolderOpen className="icon-sm" />
              View Design Files
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/design/shop-drawings">
              <FileText className="icon-sm" />
              View Shop Drawings
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/design/files">
              <FilePlus className="icon-sm" />
              Create New Design
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/projects">
              <FolderOpen className="icon-sm" />
              View Projects
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
