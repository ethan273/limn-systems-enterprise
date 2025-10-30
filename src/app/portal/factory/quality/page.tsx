'use client';

import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LoadingState, EmptyState } from '@/components/common';
import {
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  XCircle,
  Clock,
  Award,
  TrendingUp,
} from 'lucide-react';

/**
 * Factory Quality Reports Page
 * External portal for factories to view quality metrics and reports
 */
export default function FactoryQualityPage() {
  // Queries
  const { data: qualityData, isLoading, error } = api.portal.getFactoryQualityReports.useQuery();

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  const metrics = qualityData?.aggregateMetrics;
  const inspections = qualityData?.inspections || [];

  // Get inspection status badge
  const getInspectionBadge = (passed: boolean | null) => {
    if (passed === true) {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Passed
        </Badge>
      );
    }
    if (passed === false) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Failed
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Pending
      </Badge>
    );
  };

  // Get pass rate color
  const getPassRateColor = (rate: number) => {
    if (rate >= 90) return 'text-success';
    if (rate >= 70) return 'text-warning';
    return 'text-destructive';
  };

  // Handle query error
  if (error) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Quality Reports</h1>
          <p className="page-subtitle">View quality metrics and production standards</p>
        </div>
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load quality reports"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.portal.getFactoryQualityReports.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading quality reports..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Quality Reports</h1>
        <p className="page-subtitle">View quality metrics and production standards</p>
      </div>

      {/* Quality Metrics Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Inspections */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inspections</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalInspections || 0}</div>
            <p className="text-xs text-muted-foreground">All quality checks</p>
          </CardContent>
        </Card>

        {/* Pass Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPassRateColor(metrics?.passRate || 0)}`}>
              {metrics?.passRate || 0}%
            </div>
            <Progress value={metrics?.passRate || 0} className="mt-2" />
          </CardContent>
        </Card>

        {/* Passed Inspections */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{metrics?.passedInspections || 0}</div>
            <p className="text-xs text-muted-foreground">Quality approved</p>
          </CardContent>
        </Card>

        {/* Total Defects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Defects</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalDefects || 0}</div>
            <p className="text-xs text-muted-foreground">Issues found</p>
          </CardContent>
        </Card>
      </div>

      {/* Inspection Results Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Inspection Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Passed */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                Passed Inspections
              </label>
              <span className="text-sm font-bold text-success">
                {metrics?.passedInspections || 0}
              </span>
            </div>
            <Progress
              value={metrics?.totalInspections ? (metrics.passedInspections / metrics.totalInspections) * 100 : 0}
              className="[&>div]:bg-success"
            />
          </div>

          {/* Failed */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                Failed Inspections
              </label>
              <span className="text-sm font-bold text-destructive">
                {metrics?.failedInspections || 0}
              </span>
            </div>
            <Progress
              value={metrics?.totalInspections ? (metrics.failedInspections / metrics.totalInspections) * 100 : 0}
              className="[&>div]:bg-destructive"
            />
          </div>

          {/* Pending */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Pending Inspections
              </label>
              <span className="text-sm font-bold">
                {metrics?.pendingInspections || 0}
              </span>
            </div>
            <Progress
              value={metrics?.totalInspections ? (metrics.pendingInspections / metrics.totalInspections) * 100 : 0}
            />
          </div>
        </CardContent>
      </Card>

      {/* Recent Inspections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Recent Quality Inspections
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inspections.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground">No quality inspections yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Inspections will appear here once quality checks are performed
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {inspections.map((inspection) => (
                <div
                  key={inspection.id}
                  className="flex items-start gap-4 p-4 border rounded-lg"
                >
                  {/* Status Icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                    inspection.passed === true ? 'bg-success/10' :
                    inspection.passed === false ? 'bg-destructive/10' :
                    'bg-secondary/10'
                  }`}>
                    {inspection.passed === true ? (
                      <CheckCircle className="h-6 w-6 text-success" />
                    ) : inspection.passed === false ? (
                      <XCircle className="h-6 w-6 text-destructive" />
                    ) : (
                      <Clock className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>

                  {/* Inspection Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">
                          Inspection #{inspection.id.substring(0, 8)}
                        </h3>
                        {inspection.production_orders && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Order #{inspection.production_orders.order_number}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {getInspectionBadge(inspection.passed)}
                          {inspection.inspector_name && (
                            <Badge variant="outline" className="text-xs">
                              Inspector: {inspection.inspector_name}
                            </Badge>
                          )}
                          {(inspection.defects_found || 0) > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {inspection.defects_found} Defect{inspection.defects_found !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        {inspection.notes && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {inspection.notes}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Inspected {new Date(inspection.inspection_date!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
