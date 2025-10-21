'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangeSelector } from '@/components/DateRangeSelector';
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
  FileText,
  Mail,
  Lightbulb,
  ArrowRight,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { ExportPDFButton } from '@/components/ExportPDFButton';
import { EmptyState } from '@/components/common/EmptyState';
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
  success: Award,
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

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--muted))',
  'hsl(var(--destructive))',
];

export default function PartnerDashboardPage() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const { data: partners, isLoading, error } = api.dashboards.getPartners.useQuery(
    { dateRange },
    { refetchInterval: 60000 } // Auto-refresh every 60 seconds
  );

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  const { data: insights } = api.dashboards.getPartnerInsights.useQuery();

  // Handle query error
  if (error) {
    return (
      <div className="page-container">
        <div className="dashboard-header">
          <div>
            <h1 className="page-title">Partner Relationship Dashboard</h1>
            <p className="page-subtitle">Partner management, performance tracking, and relationship metrics</p>
          </div>
        </div>
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load partner data"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.dashboards.getPartners.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading partner dashboard...</p>
        </div>
      </div>
    );
  }

  if (!partners) {
    return (
      <div className="page-container">
        <div className="dashboard-header">
          <div>
            <h1 className="page-title">Partner Relationship Dashboard</h1>
            <p className="page-subtitle">Partner management, performance tracking, and relationship metrics</p>
          </div>
        </div>
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load partner data"
          description="Unable to retrieve partner dashboard data. Please try again."
          action={{
            label: 'Try Again',
            onClick: () => utils.dashboards.getPartners.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  const { summary, performance, typeDistribution, topPartners, partnerTrend, statusDistribution } = partners;

  return (
    <div className="dashboard-page">
      <div id="dashboard-export-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Partner Relationship Dashboard</h1>
          <p className="page-subtitle">Partner management, performance tracking, and relationship metrics</p>
        </div>
        <div className="dashboard-actions">
          <DateRangeSelector
            value={dateRange}
            onChange={(value: any) => setDateRange(value)}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => utils.dashboards.getPartners.invalidate()}
            title="Refresh data"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <ExportPDFButton dashboardName="Partners Dashboard" dateRange={dateRange} />
          <Button variant="outline" asChild>
            <Link href="/partners">
              <Building2 className="icon-sm" />
              View Partners
            </Link>
          </Button>
        </div>
      </div>

      {/* Partner Summary Metrics */}
      <div className="dashboard-section">
        <h2 className="section-title">Partner Overview</h2>
        <div className="dashboard-grid">
          <DashboardStatCard
            title="Total Partners"
            value={summary.totalPartners}
            description={`${summary.newPartners} new this period`}
            icon={Users}
            iconColor="primary"
          />

          <DashboardStatCard
            title="Active Partners"
            value={summary.activePartners}
            description="Currently active"
            icon={UserCheck}
            iconColor="success"
          />

          <DashboardStatCard
            title="Inactive Partners"
            value={summary.inactivePartners}
            description="Require attention"
            icon={UserX}
            iconColor="warning"
          />

          <DashboardStatCard
            title="Pending Approval"
            value={summary.pendingPartners}
            description="Awaiting review"
            icon={Clock}
            iconColor="warning"
          />
        </div>
      </div>

      {/* Partner Engagement Metrics */}
      <div className="dashboard-section">
        <h2 className="section-title">Partner Engagement</h2>
        <div className="dashboard-grid">
          <DashboardStatCard
            title="Total Contacts"
            value={summary.totalContacts}
            description="Partner contacts"
            icon={Mail}
            iconColor="info"
          />

          <DashboardStatCard
            title="Total Documents"
            value={summary.totalDocuments}
            description="Shared documents"
            icon={FileText}
            iconColor="info"
          />

          <DashboardStatCard
            title="New Contacts"
            value={summary.avgContactsPerPartner}
            description="Avg per partner"
            icon={UserPlus}
            iconColor="info"
          />
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="dashboard-section">
        <h2 className="section-title">Performance Metrics</h2>
        <div className="dashboard-grid">
          <DashboardStatCard
            title="Avg On-Time Rate"
            value={`${performance.avgOnTimeRate.toFixed(1)}%`}
            description={performance.avgOnTimeRate >= 90 ? 'Excellent' : 'Needs improvement'}
            icon={performance.avgOnTimeRate >= 90 ? TrendingUp : TrendingDown}
            iconColor={performance.avgOnTimeRate >= 90 ? 'success' : 'warning'}
          />

          <DashboardStatCard
            title="Avg Quality Score"
            value={`${performance.avgQualityScore.toFixed(1)}%`}
            description={performance.avgQualityScore >= 85 ? 'High quality' : 'Needs attention'}
            icon={performance.avgQualityScore >= 85 ? TrendingUp : TrendingDown}
            iconColor={performance.avgQualityScore >= 85 ? 'success' : 'warning'}
          />
        </div>
      </div>

      {/* Partner Growth Trend */}
      <div className="dashboard-section">
        <Card>
          <CardHeader>
            <CardTitle>Partner Growth Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={partnerTrend}>
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
                <Line type="monotone" dataKey="newPartners" stroke="hsl(var(--primary))" strokeWidth={2} name="New Partners" />
                <Line type="monotone" dataKey="activePartners" stroke="hsl(var(--secondary))" strokeWidth={2} name="Active Partners" />
                <Line type="monotone" dataKey="totalPartners" stroke="hsl(var(--muted-foreground))" strokeWidth={2} name="Total Partners" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Type and Status Distribution */}
      <div className="dashboard-section">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Partner Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Partner Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {typeDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={typeDistribution}
                      dataKey="count"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) => `${entry.type}: ${entry.count}`}
                    >
                      {typeDistribution.map((entry, index) => (
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
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <p>No partner type data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Partner Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusDistribution}>
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

      {/* Top Partners Table */}
      <div className="dashboard-section">
        <Card>
          <CardHeader>
            <CardTitle>Top Partners by Order Volume</CardTitle>
          </CardHeader>
          <CardContent>
            {topPartners.length > 0 ? (
              <div className="w-full">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Partner Name</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Total Orders</th>
                      <th>On-Time Rate</th>
                      <th>Quality Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPartners.map((partner, index) => (
                      <tr key={index}>
                        <td className="font-medium">{partner.name}</td>
                        <td>
                          <span className="badge">
                            Supplier
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${
                            partner.status === 'active' ? 'badge-success' :
                            partner.status === 'inactive' ? 'badge-error' :
                            'badge-warning'
                          }`}>
                            {partner.status}
                          </span>
                        </td>
                        <td>{partner.orderCount}</td>
                        <td>
                          <span className="text-muted-foreground">
                            N/A
                          </span>
                        </td>
                        <td>
                          <span className="text-muted-foreground">
                            N/A
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                <p>No partner order data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Partner Insights */}
      {insights && insights.length > 0 && (
        <div className="dashboard-section">
          <h2 className="section-title">Partner Insights & Recommendations</h2>
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
            <Link href="/partners">
              <Users className="icon-sm" />
              View All Partners
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/partners?status=active">
              <UserCheck className="icon-sm" />
              View Active Partners
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/partners?status=pending">
              <Clock className="icon-sm" />
              Review Pending
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/partners/new">
              <UserPlus className="icon-sm" />
              Add New Partner
            </Link>
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}
