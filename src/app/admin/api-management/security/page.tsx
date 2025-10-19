'use client';

import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/common';
import Link from 'next/link';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  ArrowLeft,
} from 'lucide-react';
import { format } from 'date-fns';

export default function SecurityDashboard() {
  const dateRange = {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
  };

  // Fetch security metrics
  const { data: metrics, isLoading: isLoadingMetrics } = api.apiSecurity.getSecurityMetrics.useQuery();

  // Fetch recent audit logs
  const { data: auditData, isLoading: isLoadingAudit } = api.apiAudit.getAuditLogs.useQuery({
    limit: 50,
    offset: 0,
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  // Fetch audit statistics
  const { data: stats, isLoading: isLoadingStats } = api.apiAudit.getAuditStatistics.useQuery({
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  // Fetch active emergency access
  const { data: emergencyAccess, isLoading: isLoadingEmergency } = api.apiSecurity.getActiveEmergencyAccess.useQuery();

  if (isLoadingMetrics || isLoadingAudit || isLoadingStats || isLoadingEmergency) {
    return (
      <div className="page-container">
        <LoadingState message="Loading security dashboard..." size="lg" />
      </div>
    );
  }

  const logs = auditData?.logs || [];
  const totalLogs = auditData?.total || 0;

  // Export audit logs
  const exportMutation = api.apiAudit.exportAuditLogs.useMutation();

  const handleExport = async () => {
    const result = await exportMutation.mutateAsync({
      startDate: dateRange.start,
      endDate: dateRange.end,
    });

    // Create download link
    const blob = new Blob([result.csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
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
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="page-title">Security Dashboard</h1>
              <p className="page-description">
                Real-time security monitoring and audit trail
              </p>
            </div>
          </div>
          <Button onClick={handleExport} disabled={exportMutation.isPending}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Security Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-success" />
              <div>
                <div className="text-2xl font-bold">{metrics?.totalEvents || 0}</div>
                <div className="text-sm text-muted-foreground">Total Events</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-warning" />
              <div>
                <div className="text-2xl font-bold">{metrics?.failedEvents || 0}</div>
                <div className="text-sm text-muted-foreground">Failed Attempts</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{emergencyAccess?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Emergency Access</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">
                  {metrics?.successRate?.toFixed(1) || 100}%
                </div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Emergency Access */}
      {emergencyAccess && emergencyAccess.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Active Emergency Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {emergencyAccess.map((access) => (
                <div
                  key={access.credentialId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{access.displayName}</div>
                    <div className="text-sm text-muted-foreground">
                      Granted by: {access.grantedByEmail}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Reason: {access.reason}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive">
                      {access.hoursRemaining}h remaining
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      Expires: {format(new Date(access.expiresAt), 'PPp')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit Log Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Audit Events ({totalLogs} total)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No audit events in selected date range
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`flex items-center justify-between p-3 border rounded-lg ${
                    !log.success ? 'border-destructive/50 bg-destructive/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {log.success ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    )}
                    <div>
                      <div className="font-medium">
                        {log.action.toUpperCase()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {log.ip_address || 'Unknown IP'} •{' '}
                        {log.created_at ? format(new Date(log.created_at), 'PPp') : 'Unknown time'}
                      </div>
                      {!log.success && log.error_message && (
                        <div className="text-sm text-destructive mt-1">
                          {log.error_message}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant={log.success ? 'default' : 'destructive'}>
                    {log.success ? 'Success' : 'Failed'}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Event Statistics */}
      {stats && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Event Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
                <div className="text-2xl font-bold text-success">
                  {stats.totalEvents > 0
                    ? ((stats.successfulEvents / stats.totalEvents) * 100).toFixed(1)
                    : 100}%
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Unique Users</div>
                <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Credentials Accessed</div>
                <div className="text-2xl font-bold">{stats.uniqueCredentials}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Failed Events</div>
                <div className="text-2xl font-bold text-destructive">
                  {stats.failedEvents}
                </div>
              </div>
            </div>

            {/* Events by Action */}
            <div className="mt-6">
              <div className="text-sm font-medium mb-3">Events by Action</div>
              <div className="space-y-2">
                {Object.entries(stats.eventsByAction).map(([action, count]) => (
                  <div key={action} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{action}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
