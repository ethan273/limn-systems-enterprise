'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangeSelector } from '@/components/DateRangeSelector';
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard';
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
  AlertCircle,
} from 'lucide-react';
import { ExportPDFButton } from '@/components/ExportPDFButton';
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
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const { data: design, isLoading, error } = api.dashboards.getDesign.useQuery(
    { dateRange },
    { refetchInterval: 60000 } // Auto-refresh every 60 seconds
  );

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

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

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-2xl font-semibold">Error Loading Design Dashboard</h2>
          <p className="text-muted-foreground text-center max-w-md">
            {error.message || "Failed to load design data. Please try again."}
          </p>
          <Button
            onClick={() => {
              utils.dashboards.getDesign.invalidate();
            }}
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
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
      <div id="dashboard-export-container">
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
            onClick={() => utils.dashboards.getDesign.invalidate()}
            title="Refresh data"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <ExportPDFButton dashboardName="Design Dashboard" dateRange={dateRange} />
          <Button variant="outline" asChild>
            <Link href="/design/projects">
              <FolderOpen className="icon-sm" />
              View Design Projects
            </Link>
          </Button>
        </div>
      </div>

      {/* Design Files Metrics */}
      <div className="dashboard-section">
        <h2 className="section-title">Design Files</h2>
        <div className="dashboard-grid">
          <DashboardStatCard
            title="Total Files"
            value={summary.totalDesignFiles}
            description={`${summary.newDesignFiles} new this period`}
            icon={FileText}
            iconColor="primary"
          />

          <DashboardStatCard
            title="Active Files"
            value={summary.activeDesignFiles}
            description="In progress"
            icon={Clock}
            iconColor="warning"
          />

          <DashboardStatCard
            title="Approved Files"
            value={summary.approvedDesignFiles}
            description="Completed"
            icon={CheckCircle}
            iconColor="success"
          />

          <DashboardStatCard
            title="Avg Revisions"
            value={summary.avgRevisionsPerFile}
            description="Per design file"
            icon={GitBranch}
            iconColor="info"
          />
        </div>
      </div>

      {/* Design Revisions Metrics */}
      <div className="dashboard-section">
        <h2 className="section-title">Design Revisions</h2>
        <div className="dashboard-grid">
          <DashboardStatCard
            title="Total Revisions"
            value={summary.totalRevisions}
            description={`${summary.recentRevisions} this period`}
            icon={GitBranch}
            iconColor="primary"
          />

          <DashboardStatCard
            title="Pending Reviews"
            value={summary.pendingReviews}
            description="Awaiting review"
            icon={Clock}
            iconColor="warning"
          />

          <DashboardStatCard
            title="Approved Revisions"
            value={summary.approvedRevisions}
            description="Completed"
            icon={CheckCircle}
            iconColor="success"
          />
        </div>
      </div>

      {/* Shop Drawings Metrics */}
      <div className="dashboard-section">
        <h2 className="section-title">Shop Drawings</h2>
        <div className="dashboard-grid">
          <DashboardStatCard
            title="Total Drawings"
            value={shopDrawings.total}
            description={`${shopDrawings.new} new this period`}
            icon={FileText}
            iconColor="primary"
          />

          <DashboardStatCard
            title="Pending"
            value={shopDrawings.pending}
            description="Awaiting approval"
            icon={Clock}
            iconColor="warning"
          />

          <DashboardStatCard
            title="Approved"
            value={shopDrawings.approved}
            description="Ready for production"
            icon={CheckCircle}
            iconColor="success"
          />

          <DashboardStatCard
            title="Approval Rate"
            value={`${shopDrawings.approvalRate.toFixed(1)}%`}
            description={`${shopDrawings.rejected} rejected`}
            icon={TrendingUp}
            iconColor="success"
          />
        </div>
      </div>

      {/* Project Design Coverage */}
      <div className="dashboard-section">
        <h2 className="section-title">Project Coverage</h2>
        <div className="dashboard-grid">
          <DashboardStatCard
            title="Total Projects"
            value={projects.total}
            description="Active projects"
            icon={FolderOpen}
            iconColor="primary"
          />

          <DashboardStatCard
            title="Projects with Design"
            value={projects.withDesign}
            description="Have design files"
            icon={FileText}
            iconColor="info"
          />

          <DashboardStatCard
            title="Design Coverage"
            value={`${projects.designCoverage.toFixed(1)}%`}
            description="Coverage rate"
            icon={TrendingUp}
            iconColor="success"
          />
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
            <Link href="/design/projects">
              <FolderOpen className="icon-sm" />
              View Design Projects
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/production/shop-drawings">
              <FileText className="icon-sm" />
              View Shop Drawings
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/design/briefs">
              <FilePlus className="icon-sm" />
              View Design Briefs
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/crm/projects">
              <FolderOpen className="icon-sm" />
              View All Projects
            </Link>
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}
