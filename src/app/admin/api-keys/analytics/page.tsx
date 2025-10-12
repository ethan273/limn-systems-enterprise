'use client';

import { useState } from 'react';
import { api } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  Activity,
  AlertCircle,
  TrendingUp,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Code,
} from 'lucide-react';

export default function AnalyticsPage() {
  const [selectedMetric, setSelectedMetric] = useState<'requests' | 'response_time' | 'error_rate'>('requests');
  const [days, setDays] = useState(7);

  // Fetch usage analytics
  const { data: analyticsData, isLoading } = api.apiCredentials.getUsageAnalytics.useQuery({ days });

  // Fetch all credentials for filter dropdown
  const { data: credentials } = api.apiCredentials.getAll.useQuery();

  // Calculate date range
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const weekStart = formatDate(startDate);
  const weekEnd = formatDate(today);

  const handlePrevious = () => {
    setDays(prev => Math.min(prev + 7, 90));
  };

  const handleNext = () => {
    setDays(prev => Math.max(prev - 7, 7));
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-description">
            Detailed usage analytics and insights for your API keys
          </p>
        </div>
        <Button variant="outline">
          <Code className="h-4 w-4 mr-2" />
          Generate Tracking Script
        </Button>
      </div>

      {/* Tracking Setup Card */}
      <Card className="p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Code className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Start Tracking API Usage</h3>
            <p className="text-muted-foreground mb-3">
              Generate custom tracking scripts to automatically monitor your API usage across different
              applications and programming languages.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Supported:</strong> JavaScript, Python, PHP, Go, cURL
            </p>
          </div>
        </div>
      </Card>

      {/* Analytics Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            API Usage Analytics
          </h2>
          <Button variant="outline" size="sm">
            All API Keys
          </Button>
        </div>

        {/* Metrics Tabs */}
        <div className="flex gap-2 border-b border-border pb-2">
          <Button
            variant={selectedMetric === 'requests' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedMetric('requests')}
          >
            <Activity className="h-4 w-4 mr-2" />
            Total Requests
          </Button>
          <Button
            variant={selectedMetric === 'response_time' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedMetric('response_time')}
          >
            <Clock className="h-4 w-4 mr-2" />
            Avg Response Time
          </Button>
          <Button
            variant={selectedMetric === 'error_rate' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedMetric('error_rate')}
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Error Rate
          </Button>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handlePrevious} disabled={days >= 90}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {days === 7 ? 'Last 7 Days' : days === 14 ? 'Last 14 Days' : days === 30 ? 'Last 30 Days' : `Last ${days} Days`} ({weekStart} - {weekEnd})
            </span>
            <Button variant="outline" size="sm" onClick={handleNext} disabled={days <= 7}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant={days === 7 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDays(7)}
            >
              7D
            </Button>
            <Button
              variant={days === 30 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDays(30)}
            >
              30D
            </Button>
            <Button
              variant={days === 90 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDays(90)}
            >
              90D
            </Button>
          </div>
        </div>

        {/* Empty State / Chart Area */}
        {isLoading ? (
          <Card className="p-12">
            <div className="text-center">
              <p className="text-muted-foreground">Loading analytics...</p>
            </div>
          </Card>
        ) : !analyticsData || analyticsData.totalRequests === 0 ? (
          <Card className="p-12">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">No Usage Data Available</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Start using your API keys to see analytics data here. Usage data will be collected
                  automatically once you integrate the tracking scripts.
                </p>
              </div>
              <div className="flex gap-3 justify-center pt-4">
                <Button>
                  <Code className="h-4 w-4 mr-2" />
                  Generate Tracking Script
                </Button>
                <Button variant="outline">
                  View Documentation
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Usage Over Time</h3>
            <div className="space-y-4">
              {analyticsData.timeSeries.map((dataPoint) => (
                <div key={dataPoint.date} className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground w-24">{dataPoint.date}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted h-8 rounded overflow-hidden">
                        <div
                          className="bg-primary h-full"
                          style={{
                            width: `${(dataPoint.requests / Math.max(...analyticsData.timeSeries.map(d => d.requests))) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="text-sm font-medium w-16 text-right">
                        {dataPoint.requests}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Total Requests</span>
            </div>
            <div className="text-3xl font-bold">
              {analyticsData?.totalRequests.toLocaleString() || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-2">Last {days} days</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium text-muted-foreground">Avg Response Time</span>
            </div>
            <div className="text-3xl font-bold">
              {analyticsData?.avgResponseTime ? `${analyticsData.avgResponseTime}ms` : 'N/A'}
            </div>
            <p className="text-sm text-muted-foreground mt-2">Last {days} days</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <span className="text-sm font-medium text-muted-foreground">Error Rate</span>
            </div>
            <div className="text-3xl font-bold">
              {analyticsData?.errorRate !== undefined ? `${analyticsData.errorRate}%` : 'N/A'}
            </div>
            <p className="text-sm text-muted-foreground mt-2">Last {days} days</p>
          </Card>
        </div>

        {/* API Keys Performance Table */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Performance by API Key</h3>
          {!credentials || credentials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No API keys configured yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {credentials.map((cred: any) => {
                const lastUsed = cred.last_used_at
                  ? new Date(cred.last_used_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Never';

                return (
                  <div
                    key={cred.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{cred.display_name}</h4>
                      <p className="text-sm text-muted-foreground">{cred.service_name}</p>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <p className="font-medium">Last Used</p>
                        <p className="text-muted-foreground">{lastUsed}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Environment</p>
                        <p className="text-muted-foreground capitalize">{cred.environment || 'production'}</p>
                      </div>
                      <div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            cred.is_active
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                          }`}
                        >
                          {cred.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
