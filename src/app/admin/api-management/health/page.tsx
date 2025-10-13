'use client';

/**
 * Health Monitoring Dashboard
 *
 * Real-time health status monitoring for all API credentials
 */

import { useState } from 'react';
import { api } from '@/lib/api/client';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Download,
} from 'lucide-react';

export default function HealthMonitoringPage() {
  const [selectedCredential, setSelectedCredential] = useState<string | null>(null);
  const [uptimePeriod, setUptimePeriod] = useState<1 | 7 | 30 | 90>(30);

  // Fetch health dashboard
  const { data: dashboard, refetch: refetchDashboard } =
    api.apiHealth.getHealthDashboard.useQuery(undefined, {
      refetchInterval: 60000, // Refresh every minute
    });

  // Fetch detailed metrics for selected credential
  const { data: uptimeMetrics } = api.apiHealth.getUptimeMetrics.useQuery(
    {
      credentialId: selectedCredential!,
      days: uptimePeriod,
    },
    {
      enabled: !!selectedCredential,
    }
  );

  const { data: healthHistory } = api.apiHealth.getHealthHistory.useQuery(
    {
      credentialId: selectedCredential!,
      days: uptimePeriod,
    },
    {
      enabled: !!selectedCredential,
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
        return 'text-green-600 bg-green-50';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50';
      case 'unhealthy':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Health Monitoring</h1>
          <p className="mt-2 text-gray-600">
            Real-time health status for all API credentials
          </p>
        </div>

        <button
          onClick={() => performAllHealthChecks.mutate()}
          disabled={performAllHealthChecks.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-5 w-5 ${performAllHealthChecks.isPending ? 'animate-spin' : ''}`}
          />
          Run All Checks
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Credentials</p>
              <p className="text-3xl font-bold text-gray-900">
                {dashboard?.total_credentials || 0}
              </p>
            </div>
            <Activity className="h-10 w-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Healthy</p>
              <p className="text-3xl font-bold text-green-600">
                {dashboard?.healthy || 0}
              </p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Degraded</p>
              <p className="text-3xl font-bold text-yellow-600">
                {dashboard?.degraded || 0}
              </p>
            </div>
            <AlertTriangle className="h-10 w-10 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unhealthy</p>
              <p className="text-3xl font-bold text-red-600">
                {dashboard?.unhealthy || 0}
              </p>
            </div>
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
        </div>
      </div>

      {/* Credentials List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Credentials Status</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {dashboard?.credentials.map((credential) => (
            <div
              key={credential.id}
              className={`p-6 hover:bg-gray-50 cursor-pointer ${
                selectedCredential === credential.id ? 'bg-blue-50' : ''
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

                    <h3 className="text-lg font-semibold text-gray-900">
                      {credential.name}
                    </h3>

                    <span className="text-sm text-gray-500">
                      {credential.service_type}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      <span>24h Uptime: {credential.uptime_24h.toFixed(2)}%</span>
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
                      <div className="flex items-center gap-2 text-red-600">
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
                  className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                >
                  Check Now
                </button>
              </div>
            </div>
          ))}

          {!dashboard?.credentials.length && (
            <div className="p-12 text-center text-gray-500">
              No active credentials to monitor
            </div>
          )}
        </div>
      </div>

      {/* Detailed Metrics (when credential selected) */}
      {selectedCredential && uptimeMetrics && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Detailed Metrics
              </h2>

              <div className="flex items-center gap-2">
                <select
                  value={uptimePeriod}
                  onChange={(e) =>
                    setUptimePeriod(Number(e.target.value) as 1 | 7 | 30 | 90)
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value={1}>Last 24 hours</option>
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 90 days</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Uptime Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Uptime</p>
                <p className="text-2xl font-bold text-gray-900">
                  {uptimeMetrics.uptime_percentage.toFixed(2)}%
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Checks</p>
                <p className="text-2xl font-bold text-gray-900">
                  {uptimeMetrics.total_checks}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Failed Checks</p>
                <p className="text-2xl font-bold text-red-600">
                  {uptimeMetrics.failed_checks}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {uptimeMetrics.average_response_time_ms}ms
                </p>
              </div>
            </div>

            {/* Incidents */}
            {uptimeMetrics.incidents.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Incidents ({uptimeMetrics.incidents.length})
                </h3>

                <div className="space-y-3">
                  {uptimeMetrics.incidents.map((incident, index) => (
                    <div
                      key={index}
                      className="p-4 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <div>
                            <p className="font-semibold text-gray-900">
                              {incident.status.toUpperCase()}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(incident.started_at).toLocaleString()} -{' '}
                              {incident.ended_at
                                ? new Date(incident.ended_at).toLocaleString()
                                : 'Ongoing'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            Duration: {incident.duration_minutes || 0} minutes
                          </p>
                        </div>
                      </div>
                      {incident.error_message && (
                        <p className="mt-2 text-sm text-gray-600">
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recent Health Checks
                </h3>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Response Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Error
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {healthHistory.slice(0, 20).map((check) => (
                        <tr key={check.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(check.checked_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                check.status
                              )}`}
                            >
                              {check.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {check.response_time_ms
                              ? `${check.response_time_ms}ms`
                              : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
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
