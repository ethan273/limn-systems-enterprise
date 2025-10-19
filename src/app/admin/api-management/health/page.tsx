'use client';

/**
 * Health Monitoring Dashboard
 *
 * Real-time health status monitoring for all API credentials
 */

import { useState } from 'react';
import { api } from '@/lib/api/client';
import { LoadingState } from '@/components/ui/loading-state';
import Link from 'next/link';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function HealthMonitoringPage() {
  const [selectedCredential, setSelectedCredential] = useState<string | null>(null);
  const [uptimePeriod, setUptimePeriod] = useState<1 | 7 | 30 | 90>(30);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch health dashboard with real-time updates
  const { data: dashboard, refetch: refetchDashboard, isLoading } =
    api.apiHealth.getHealthDashboard.useQuery(undefined, {
      refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds when enabled
      refetchOnWindowFocus: true,
    });

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading health dashboard..." size="lg" />
      </div>
    );
  }

  // Fetch detailed metrics for selected credential with real-time updates
  const { data: uptimeMetrics } = api.apiHealth.getUptimeMetrics.useQuery(
    {
      credentialId: selectedCredential!,
      days: uptimePeriod,
    },
    {
      enabled: !!selectedCredential,
      refetchInterval: autoRefresh && selectedCredential ? 30000 : false,
    }
  );

  const { data: healthHistory } = api.apiHealth.getHealthHistory.useQuery(
    {
      credentialId: selectedCredential!,
      days: uptimePeriod,
    },
    {
      enabled: !!selectedCredential,
      refetchInterval: autoRefresh && selectedCredential ? 30000 : false,
    }
  );

  // Manual health check mutation
  const performHealthCheck = api.apiHealth.performHealthCheck.useMutation({
    onSuccess: () => {
      refetchDashboard();
    },
  });

  const performAllHealthChecks = api.apiHealth.performAllHealthChecks.useMutation({
    onSuccess: () => {
      refetchDashboard();
    },
  });

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-success bg-success/10 border-success/20';
      case 'degraded':
        return 'text-warning bg-warning/10 border-warning/20';
      case 'unhealthy':
        return 'text-destructive bg-destructive/10 border-destructive/20';
      default:
        return 'text-muted-foreground bg-muted/10 border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5" />;
      case 'unhealthy':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
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
        <div>
          <h1 className="page-title">Health Monitoring</h1>
          <p className="page-description">
            Real-time health status for all API credentials
            {autoRefresh && (
              <span className="ml-2 inline-flex items-center text-xs text-success">
                <span className="mr-1 h-2 w-2 rounded-full bg-success animate-pulse" />
                Live
              </span>
            )}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`btn ${autoRefresh ? 'btn-ghost' : 'btn-outline'} flex items-center gap-2`}
            title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
          >
            <Activity className={`h-4 w-4 ${autoRefresh ? 'animate-pulse' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>
          <button
            onClick={() => performAllHealthChecks.mutate()}
            disabled={performAllHealthChecks.isPending}
            className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-5 w-5 ${performAllHealthChecks.isPending ? 'animate-spin' : ''}`}
            />
            Run All Checks
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Credentials</p>
              <p className="text-3xl font-bold text-primary">
                {dashboard?.total_credentials || 0}
              </p>
            </div>
            <Activity className="h-10 w-10 text-primary" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Healthy</p>
              <p className="text-3xl font-bold text-success">
                {dashboard?.healthy || 0}
              </p>
            </div>
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Degraded</p>
              <p className="text-3xl font-bold text-warning">
                {dashboard?.degraded || 0}
              </p>
            </div>
            <AlertTriangle className="h-10 w-10 text-warning" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Unhealthy</p>
              <p className="text-3xl font-bold text-destructive">
                {dashboard?.unhealthy || 0}
              </p>
            </div>
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
        </div>
      </div>

      {/* Credentials List */}
      <div className="card">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-primary">Credentials Status</h2>
        </div>

        <div className="divide-y">
          {dashboard?.credentials.map((credential) => (
            <div
              key={credential.id}
              className={`p-6 hover-card cursor-pointer ${
                selectedCredential === credential.id ? 'bg-muted' : ''
              }`}
              onClick={() => setSelectedCredential(credential.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(
                        credential.status
                      )}`}
                    >
                      {getStatusIcon(credential.status)}
                      {credential.status.toUpperCase()}
                    </span>

                    <h3 className="text-lg font-semibold text-primary">
                      {credential.name}
                    </h3>

                    <span className="text-sm text-muted-foreground">
                      {credential.service_type}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-6 text-sm text-secondary">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      <span>24h Uptime: {Number(credential.uptime_24h).toFixed(2)}%</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        Last checked:{' '}
                        {credential.last_checked_at
                          ? new Date(credential.last_checked_at).toLocaleString()
                          : 'Never'}
                      </span>
                    </div>

                    {credential.consecutive_failures > 0 && (
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span>
                          {credential.consecutive_failures} consecutive failures
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    performHealthCheck.mutate({ credentialId: credential.id });
                  }}
                  disabled={performHealthCheck.isPending}
                  className="btn btn-ghost disabled:opacity-50"
                >
                  Check Now
                </button>
              </div>
            </div>
          ))}

          {!dashboard?.credentials.length && (
            <div className="p-12 text-center text-muted-foreground">
              No active credentials to monitor
            </div>
          )}
        </div>
      </div>

      {/* Detailed Metrics (when credential selected) */}
      {selectedCredential && uptimeMetrics && (
        <div className="card">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-primary">
                Detailed Metrics
              </h2>

              <div className="flex items-center gap-2">
                <Select value={uptimePeriod.toString()} onValueChange={(value) => setUptimePeriod(Number(value) as 1 | 7 | 30 | 90)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Last 24 hours</SelectItem>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Uptime Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Uptime</p>
                <p className="text-2xl font-bold text-primary">
                  {Number(uptimeMetrics.uptime_percentage).toFixed(2)}%
                </p>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Checks</p>
                <p className="text-2xl font-bold text-primary">
                  {uptimeMetrics.total_checks}
                </p>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Failed Checks</p>
                <p className="text-2xl font-bold text-destructive">
                  {uptimeMetrics.failed_checks}
                </p>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold text-primary">
                  {uptimeMetrics.average_response_time_ms}ms
                </p>
              </div>
            </div>

            {/* Incidents */}
            {uptimeMetrics.incidents.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-primary mb-4">
                  Incidents ({uptimeMetrics.incidents.length})
                </h3>

                <div className="space-y-3">
                  {uptimeMetrics.incidents.map((incident, index) => (
                    <div
                      key={index}
                      className="p-4 alert-error rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-5 w-5 text-destructive" />
                          <div>
                            <p className="font-semibold text-primary">
                              {incident.status.toUpperCase()}
                            </p>
                            <p className="text-sm text-secondary">
                              {new Date(incident.started_at).toLocaleString()} -{' '}
                              {incident.ended_at
                                ? new Date(incident.ended_at).toLocaleString()
                                : 'Ongoing'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-primary">
                            Duration: {incident.duration_minutes || 0} minutes
                          </p>
                        </div>
                      </div>
                      {incident.error_message && (
                        <p className="mt-2 text-sm text-secondary">
                          {incident.error_message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Health Checks */}
            {healthHistory && healthHistory.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-primary mb-4">
                  Recent Health Checks
                </h3>

                <div className="w-full">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Response Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Error
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {healthHistory.slice(0, 20).map((check) => (
                        <tr key={check.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-primary">
                            {new Date(check.checked_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                check.status
                              )}`}
                            >
                              {check.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-primary">
                            {check.response_time_ms
                              ? `${check.response_time_ms}ms`
                              : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-primary">
                            {check.error_message || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
