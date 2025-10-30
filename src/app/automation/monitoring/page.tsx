/**
 * Workflow Monitoring Dashboard - Phase 3D
 *
 * UI for monitoring workflow execution metrics, performance, and system health
 *
 * @module automation/monitoring
 * @created 2025-10-30
 * @phase Phase 3 - Automation & Workflows
 */

'use client';

import { useState } from 'react';
import { Breadcrumb } from '@/components/common';
import { api } from '@/utils/api';
import { Button } from '@/components/ui/button';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,


  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  Server,
  RefreshCw,
} from 'lucide-react';

export default function WorkflowMonitoringPage() {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [activeTab, setActiveTab] = useState('overview');

  // Queries
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } =
    api.workflowMonitoring.getExecutionMetrics.useQuery({ timeRange });

  const { data: health, refetch: refetchHealth } =
    api.workflowMonitoring.getSystemHealth.useQuery();

  const { data: trends } = api.workflowMonitoring.getPerformanceTrends.useQuery({
    days: 7,
  });

  const { data: failures } = api.workflowMonitoring.getFailedWorkflows.useQuery({
    limit: 10,
  });

  const { data: queueStatus } = api.workflowMonitoring.getQueueStatus.useQuery();

  const handleRefresh = () => {
    refetchMetrics();
    refetchHealth();
  };

  const getHealthColor = (status?: string) => {
    switch (status) {
      case 'healthy':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'critical':
        return 'text-destructive';
      default:
        return 'text-gray-600';
    }
  };

  const getHealthBadge = (status?: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-success">Healthy</Badge>;
      case 'warning':
        return <Badge className="bg-warning">Warning</Badge>;
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Breadcrumb
        items={[
          { label: 'Automation', href: '/automation' },
          { label: 'Monitoring Dashboard', href: '/automation/monitoring' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflow Monitoring</h1>
          <p className="text-muted-foreground mt-1">
            Real-time monitoring and performance metrics for automation workflows
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Banner */}
      {health && (
        <Card className={`border-2 ${health.status === 'healthy' ? 'border-success bg-success/10' : health.status === 'warning' ? 'border-warning bg-warning/10' : 'border-destructive bg-destructive/10'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Server className={`h-8 w-8 ${getHealthColor(health.status)}`} />
                <div>
                  <h3 className="text-lg font-semibold">System Health</h3>
                  <p className="text-sm text-muted-foreground">
                    {health.activeWorkflows} active workflows • {health.executionsLast24h} executions (24h)
                  </p>
                </div>
              </div>
              <div className="text-right">
                {getHealthBadge(health.status)}
                <p className="text-sm text-muted-foreground mt-2">
                  Failure Rate: {health.failureRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="text-2xl font-bold text-muted-foreground">...</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics?.totalExecutions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {timeRange === '1h' && 'in the last hour'}
                  {timeRange === '24h' && 'in the last 24 hours'}
                  {timeRange === '7d' && 'in the last 7 days'}
                  {timeRange === '30d' && 'in the last 30 days'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="text-2xl font-bold text-muted-foreground">...</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics?.successRate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.successfulExecutions || 0} successful
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failures</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="text-2xl font-bold text-muted-foreground">...</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics?.failedExecutions || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.totalExecutions ? Math.round((metrics.failedExecutions / metrics.totalExecutions) * 100) : 0}% failure rate
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Execution Time</CardTitle>
            <Clock className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="text-2xl font-bold text-muted-foreground">...</div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {metrics?.avgExecutionTimeMs
                    ? `${(metrics.avgExecutionTimeMs / 1000).toFixed(2)}s`
                    : '0s'}
                </div>
                <p className="text-xs text-muted-foreground">average duration</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Queue Status */}
      {queueStatus && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Queue Total</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{queueStatus.total}</div>
              <p className="text-xs text-muted-foreground">items in queue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Running</CardTitle>
              <Activity className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{queueStatus.running}</div>
              <p className="text-xs text-muted-foreground">currently executing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{queueStatus.pending}</div>
              <p className="text-xs text-muted-foreground">waiting to execute</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="overview">Performance Trends</TabsTrigger>
          <TabsTrigger value="failures">Recent Failures</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>7-Day Performance Trends</CardTitle>
              <CardDescription>Daily execution statistics over the past week</CardDescription>
            </CardHeader>
            <CardContent>
              {!trends || trends.trends.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No performance data available for the selected period.
                </div>
              ) : (
                <div className="space-y-4">
                  {(trends.trends as any[]).map((trend) => {
                    const successRate = trend.total > 0
                      ? Math.round((trend.success / trend.total) * 100)
                      : 0;

                    return (
                      <div key={trend.date} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="text-sm font-medium w-32">
                            {new Date(trend.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-success" />
                              <span className="text-sm">{trend.success} successful</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-destructive" />
                              <span className="text-sm">{trend.failed} failed</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{trend.total} total</Badge>
                          <Badge
                            className={
                              successRate >= 95
                                ? 'bg-success'
                                : successRate >= 80
                                  ? 'bg-warning'
                                  : 'bg-destructive'
                            }
                          >
                            {successRate}% success
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failures">
          <Card>
            <CardHeader>
              <CardTitle>Recent Failures</CardTitle>
              <CardDescription>Last 10 failed workflow executions</CardDescription>
            </CardHeader>
            <CardContent>
              {!failures || failures.failures.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No failures recorded. All workflows are executing successfully!
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Workflow ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {failures.failures.map((failure: any) => (
                      <TableRow key={failure.id}>
                        <TableCell className="text-sm">
                          {new Date(failure.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm font-mono text-muted-foreground">
                          {failure.workflow_id?.substring(0, 8) || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Failed
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-md truncate">
                          {failure.result?.error || failure.result?.message || 'Error details not available'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
