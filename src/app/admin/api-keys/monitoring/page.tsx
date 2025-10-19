'use client';

import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState, PageHeader } from '@/components/common';
import {
  Shield,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

export default function MonitoringPage() {
  // Fetch security metrics
  const { data: securityData, isLoading, error } = api.apiCredentials.getSecurityMetrics.useQuery();

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 70) return 'text-warning';
    return 'text-destructive';
  };

  const _getScoreBackground = (score: number) => {
    if (score >= 90) return 'bg-success/20';
    if (score >= 70) return 'bg-warning/20';
    return 'bg-destructive/20';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'info':
        return <Info className="h-5 w-5 text-primary" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const styles = {
      critical: 'badge-destructive',
      warning: 'badge-warning',
      info: 'badge-info',
    };
    return styles[severity as keyof typeof styles] || styles.info;
  };

  // Handle query error
  if (error) {
    return (
      <div className="page-container">
        <PageHeader
          title="Security Monitoring"
          subtitle="Real-time security insights and alerts for your API credentials"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load security metrics"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.apiCredentials.getSecurityMetrics.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Security Monitoring</h1>
          <p className="page-description">
            Real-time security insights and alerts for your API credentials
          </p>
        </div>
        <Button variant="outline">
          <Shield className="h-4 w-4 mr-2" />
          Security Settings
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading security metrics...</p>
        </div>
      ) : (
        <>
          {/* Security Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Security Score */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Shield className={`h-5 w-5 ${getScoreColor(securityData?.securityScore || 0)}`} />
                <span className="text-sm font-medium text-muted-foreground">Security Score</span>
              </div>
              <div className={`text-4xl font-bold ${getScoreColor(securityData?.securityScore || 0)}`}>
                {securityData?.securityScore || 0}%
              </div>
              <div className="mt-4">
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      securityData && securityData.securityScore >= 90
                        ? 'bg-success'
                        : securityData && securityData.securityScore >= 70
                          ? 'bg-warning'
                          : 'bg-destructive'
                    }`}
                    style={{ width: `${securityData?.securityScore || 0}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Last 24 hours</span>
              </div>
            </Card>

            {/* Average Response Time */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Avg Response Time</span>
              </div>
              <div className="text-4xl font-bold">
                {securityData?.avgResponseTime
                  ? `${securityData.avgResponseTime}ms`
                  : 'N/A'}
              </div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="h-3 w-3 text-success" />
                <span className="text-xs text-success">Optimal</span>
              </div>
            </Card>

            {/* Error Rate */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <XCircle className="h-5 w-5 text-destructive" />
                <span className="text-sm font-medium text-muted-foreground">Error Rate</span>
              </div>
              <div className="text-4xl font-bold">
                {securityData?.recentErrorRate !== undefined
                  ? `${securityData.recentErrorRate}%`
                  : 'N/A'}
              </div>
              <div className="flex items-center gap-1 mt-2">
                {securityData && securityData.recentErrorRate > 5 ? (
                  <>
                    <AlertTriangle className="h-3 w-3 text-warning" />
                    <span className="text-xs text-warning">Elevated</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3 text-success" />
                    <span className="text-xs text-success">Normal</span>
                  </>
                )}
              </div>
            </Card>
          </div>

          {/* System Status */}
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">System Status</h2>
              <div className="flex items-center gap-2">
                {securityData && securityData.activeAlerts === 0 ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span className="text-sm font-medium text-success">All systems operational</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-warning" />
                    <span className="text-sm font-medium text-warning">
                      {securityData?.activeAlerts} active alert{securityData && securityData.activeAlerts !== 1 ? 's' : ''}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 border border-border rounded-lg">
                <Shield className="h-8 w-8 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Credentials</p>
                  <p className="text-lg font-semibold">{securityData?.totalCredentials || 0} Active</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 border border-border rounded-lg">
                <AlertCircle className="h-8 w-8 text-warning" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Alerts</p>
                  <p className="text-lg font-semibold">
                    {securityData?.activeAlerts || 0} Issue{securityData && securityData.activeAlerts !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 border border-border rounded-lg">
                <Clock className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Uptime</p>
                  <p className="text-lg font-semibold">99.9%</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Active Alerts */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Security Events</h2>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>

            {!securityData || securityData.alerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-success" />
                <p className="text-lg font-medium">No Active Alerts</p>
                <p className="text-sm text-muted-foreground mt-1">
                  All credentials are up to date and healthy
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {securityData.alerts.map((alert: any, index: number) => (
                  <div
                    key={index}
                    className={`flex items-start gap-4 p-4 border border-border rounded-lg ${
                      alert.severity === 'critical' ? 'bg-destructive/10' :
                      alert.severity === 'warning' ? 'bg-warning/10' :
                      'bg-primary/10'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{alert.service}</p>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityBadge(alert.severity)}`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Type: {alert.type.replace(/_/g, ' ')}</span>
                        {alert.daysOverdue && <span>{alert.daysOverdue} days overdue</span>}
                        {alert.daysUntilExpiry && <span>{alert.daysUntilExpiry} days until expiry</span>}
                        {alert.daysOld && <span>{alert.daysOld} days old</span>}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Resolve
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
