'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateRangeSelector } from '@/components/DateRangeSelector';
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

  const { data: partners, isLoading, refetch } = api.dashboards.getPartners.useQuery(
    { dateRange },
    { refetchInterval: 60000 } // Auto-refresh every 60 seconds
  );

  const { data: insights } = api.dashboards.getPartnerInsights.useQuery();

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
      <div className="dashboard-page">
        <div className="dashboard-error">
          <AlertTriangle className="error-icon" />
          <p>Failed to load partner data</p>
        </div>
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
            onClick={() => refetch()}
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
          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Total Partners</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{summary.totalPartners}</div>
              <div className="metric-subtext">
                <Users className="icon-xs" />
                <span>{summary.newPartners} new this period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Active Partners</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{summary.activePartners}</div>
              <div className="metric-subtext">
                <UserCheck className="icon-xs" />
                <span>Currently active</span>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Inactive Partners</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{summary.inactivePartners}</div>
              <div className="metric-subtext">
                <UserX className="icon-xs" />
                <span>Require attention</span>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Pending Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{summary.pendingPartners}</div>
              <div className="metric-subtext">
                <Clock className="icon-xs" />
                <span>Awaiting review</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Partner Engagement Metrics */}
      <div className="dashboard-section">
        <h2 className="section-title">Partner Engagement</h2>
        <div className="dashboard-grid">
          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Total Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{summary.totalContacts}</div>
              <div className="metric-subtext">
                <Mail className="icon-xs" />
                <span>Partner contacts</span>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Total Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{summary.totalDocuments}</div>
              <div className="metric-subtext">
                <FileText className="icon-xs" />
                <span>Shared documents</span>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">New Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{summary.avgContactsPerPartner}</div>
              <div className="metric-subtext">
                <UserPlus className="icon-xs" />
                <span>Avg per partner</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="dashboard-section">
        <h2 className="section-title">Performance Metrics</h2>
        <div className="dashboard-grid">
          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Avg On-Time Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{performance.avgOnTimeRate.toFixed(1)}%</div>
              <div className={performance.avgOnTimeRate >= 90 ? 'metric-change-positive' : 'metric-change-negative'}>
                {performance.avgOnTimeRate >= 90 ? (
                  <TrendingUp className="icon-xs" />
                ) : (
                  <TrendingDown className="icon-xs" />
                )}
                <span>{performance.avgOnTimeRate >= 90 ? 'Excellent' : 'Needs improvement'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader>
              <CardTitle className="metric-label">Avg Quality Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="metric-value">{performance.avgQualityScore.toFixed(1)}%</div>
              <div className={performance.avgQualityScore >= 85 ? 'metric-change-positive' : 'metric-change-negative'}>
                {performance.avgQualityScore >= 85 ? (
                  <TrendingUp className="icon-xs" />
                ) : (
                  <TrendingDown className="icon-xs" />
                )}
                <span>{performance.avgQualityScore >= 85 ? 'High quality' : 'Needs attention'}</span>
              </div>
            </CardContent>
          </Card>
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
              <div className="overflow-x-auto">
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
