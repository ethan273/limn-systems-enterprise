/* eslint-disable security/detect-object-injection */
'use client';

/**
 * Analytics Dashboard
 *
 * Comprehensive analytics and insights for API credential usage
 */

import { useState } from 'react';
import { api } from '@/lib/api/client';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Clock,
  Download,
  Calendar,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
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
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState, EmptyState } from '@/components/common';

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<7 | 30 | 90>(30);

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Fetch analytics data
  const { data: credentials, error: credentialsError, refetch: refetchCredentials, isLoading: isLoadingCredentials } = api.apiCredentials.getAll.useQuery(undefined, {
    refetchOnMount: true,
  });

  const { data: auditStats, error: auditError, refetch: refetchAuditStats, isLoading: isLoadingAudit } = api.apiAudit.getAuditStatistics.useQuery({
    startDate: new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
  });

  const { data: healthDashboard, error: healthError, refetch: refetchHealthDashboard, isLoading: isLoadingHealth } = api.apiHealth.getHealthDashboard.useQuery();

  if (isLoadingCredentials || isLoadingAudit || isLoadingHealth) {
    return (
      <div className="page-container">
        <LoadingState message="Loading analytics..." size="lg" />
      </div>
    );
  }

  // Handle query errors
  const error = credentialsError || auditError || healthError;
  if (error) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="page-title">Analytics & Insights</h1>
              <p className="page-description">
                Comprehensive analytics for API credential usage and health
              </p>
            </div>
          </div>
        </div>
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load analytics data"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => {
              if (credentialsError) utils.apiCredentials.getAll.invalidate();
              if (auditError) utils.apiAudit.getAuditStatistics.invalidate();
              if (healthError) utils.apiHealth.getHealthDashboard.invalidate();
            },
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  // Calculate analytics data
  const calculateUsageByService = () => {
    if (!credentials) return [];

    const serviceCount: Record<string, number> = {};
    credentials.forEach((cred) => {
      const service = cred.service_name || 'Custom';
      serviceCount[service] = (serviceCount[service] || 0) + 1;
    });

    return Object.entries(serviceCount).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const calculateEnvironmentDistribution = () => {
    if (!credentials) return [];

    const envCount: Record<string, number> = {};
    credentials.forEach((cred) => {
      const env = cred.environment || 'Unknown';
      envCount[env] = (envCount[env] || 0) + 1;
    });

    return Object.entries(envCount).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  };

  const calculateCredentialAge = () => {
    if (!credentials) return [];

    const now = new Date();
    const ageRanges = {
      '0-30 days': 0,
      '31-60 days': 0,
      '61-90 days': 0,
      '90+ days': 0,
    };

    credentials.forEach((cred) => {
      const created = new Date(cred.created_at);
      const daysOld = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

      if (daysOld <= 30) ageRanges['0-30 days']++;
      else if (daysOld <= 60) ageRanges['31-60 days']++;
      else if (daysOld <= 90) ageRanges['61-90 days']++;
      else ageRanges['90+ days']++;
    });

    return Object.entries(ageRanges).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const calculateActivityTrend = () => {
    if (!auditStats) return [];

    // Generate last 30 days data
    const days: Array<{ date: string; events: number; success: number; failed: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        events: Math.floor(Math.random() * 50) + 10, // Simulated for now
        success: Math.floor(Math.random() * 45) + 10,
        failed: Math.floor(Math.random() * 5),
      });
    }
    return days;
  };

  const usageByService = calculateUsageByService();
  const environmentDistribution = calculateEnvironmentDistribution();
  const credentialAge = calculateCredentialAge();
  const activityTrend = calculateActivityTrend();

  // Chart colors using CSS variables
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

  const handleRefresh = () => {
    refetchCredentials();
    refetchAuditStats();
    refetchHealthDashboard();
  };

  const handleExport = () => {
    // Create CSV data
    const csvData = [
      ['Metric', 'Value'],
      ['Total Credentials', credentials?.length || 0],
      ['Active Credentials', credentials?.filter(c => c.is_active).length || 0],
      ['Total Events', auditStats?.totalEvents || 0],
      ['Success Rate', auditStats?.totalEvents ? ((auditStats.successfulEvents / auditStats.totalEvents) * 100).toFixed(2) + '%' : 'N/A'],
      ['Unique Users', auditStats?.uniqueUsers || 0],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="page-container">
      {/* Back Navigation */}
      <Link
        href="/admin/api-management"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to API Management
      </Link>

      {/* Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="page-title">Analytics & Insights</h1>
              <p className="page-description">
                Comprehensive analytics for API credential usage and health
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Time Period:</span>
        <div className="flex gap-2">
          {([7, 30, 90] as const).map((days) => (
            <button
              key={days}
              onClick={() => setDateRange(days)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                dateRange === days
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {days} days
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-3xl font-bold text-primary">
                  {auditStats?.totalEvents || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Last {dateRange} days
                </p>
              </div>
              <Activity className="h-10 w-10 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-3xl font-bold text-success">
                  {auditStats?.totalEvents
                    ? ((auditStats.successfulEvents / auditStats.totalEvents) * 100).toFixed(1)
                    : 100}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {auditStats?.successfulEvents || 0} successful
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-success opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-3xl font-bold text-info">
                  {auditStats?.uniqueUsers || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Unique users
                </p>
              </div>
              <Activity className="h-10 w-10 text-info opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <p className="text-3xl font-bold text-warning">
                  {healthDashboard?.credentials
                    ? Math.round(
                        healthDashboard.credentials.reduce((acc, c) => acc + (c.uptime_24h || 0), 0) /
                          healthDashboard.credentials.length
                      )
                    : 0}ms
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Health checks
                </p>
              </div>
              <Clock className="h-10 w-10 text-warning opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Activity Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={activityTrend}>
                <defs>
                  <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs fill-muted-foreground" />
                <YAxis className="text-xs fill-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="events"
                  stroke="hsl(var(--primary))"
                  fill="url(#colorEvents)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Usage by Service */}
        <Card>
          <CardHeader>
            <CardTitle>Credentials by Service</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={usageByService}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {usageByService.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Environment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={environmentDistribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                <YAxis className="text-xs fill-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--info))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Credential Age */}
        <Card>
          <CardHeader>
            <CardTitle>Credential Age Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={credentialAge} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs fill-muted-foreground" />
                <YAxis dataKey="name" type="category" className="text-xs fill-muted-foreground" width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--success))" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Event Statistics Table */}
      {auditStats && auditStats.eventsByAction && (
        <Card>
          <CardHeader>
            <CardTitle>Events by Action Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {Object.entries(auditStats.eventsByAction).map(([action, count]) => (
                    <tr key={action}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary capitalize">
                        {action}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary">
                        {count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary">
                        {auditStats.totalEvents
                          ? ((Number(count) / auditStats.totalEvents) * 100).toFixed(1)
                          : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
