'use client';

import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader } from '@/components/common/PageHeader';
import {
  ClipboardCheck,
  Clock,
  AlertTriangle,
  CheckCircle,
  Upload,
  FileText,
  Calendar,
  RefreshCw,
} from 'lucide-react';

/**
 * QC Portal Dashboard
 * External portal for QC testers to view inspections and reports
 * Phase 7: Created with portal router integration
 */
export default function QCPortalPage() {
  const router = useRouter();
  const utils = api.useUtils();

  // Use portal router procedures (enforces QC portal access)
  const { data: stats, error: statsError } = api.portal.getQCDashboardStats.useQuery();
  const { data: inspectionsData, isLoading: inspectionsLoading, error: inspectionsError } = api.portal.getQCInspections.useQuery({
    limit: 50,
    offset: 0,
  });

  const inspections = inspectionsData?.inspections || [];

  // Stats from portal router
  const pendingInspections = stats?.pendingInspections || 0;
  const completedToday = stats?.completedToday || 0;
  const defectsFound = stats?.defectsFound || 0;

  const getStatusBadge = (passed: boolean | null) => {
    if (passed === null) {
      return <Badge variant="outline">Pending</Badge>;
    }
    return passed ? (
      <Badge className="badge-success">Passed</Badge>
    ) : (
      <Badge className="badge-error">Failed</Badge>
    );
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle query errors
  if (statsError || inspectionsError) {
    const error = statsError || inspectionsError;
    return (
      <div className="page-container">
        <PageHeader
          title="Quality Inspections"
          subtitle="View and manage quality control inspections"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load inspection data"
          description={error?.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => {
              utils.portal.getQCDashboardStats.invalidate();
              utils.portal.getQCInspections.invalidate();
            },
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Quality Inspections</h1>
        <p className="text-muted-foreground mt-1">View and manage quality control inspections</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Inspections</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInspections}</div>
            <p className="text-xs text-muted-foreground">Awaiting inspection</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedToday}</div>
            <p className="text-xs text-muted-foreground">Inspections today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Defects Found (30d)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{defectsFound}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Quality Inspections List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Quality Inspections
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inspectionsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading inspections...</div>
          ) : inspections.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardCheck className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground">No inspections assigned yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {inspections.map((inspection: any) => (
                <div
                  key={inspection.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/portal/qc/inspections/${inspection.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">
                          {inspection.manufacturer_projects?.project_name || 'Inspection'}
                        </h3>
                        {getStatusBadge(inspection.passed)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {inspection.inspector_name || 'QC Inspector'}
                      </p>
                    </div>
                    <div className="text-right">
                      {inspection.defects_found !== null && inspection.defects_found > 0 && (
                        <div className="flex items-center gap-1 text-destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {inspection.defects_found} defect{inspection.defects_found !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Date: {formatDate(inspection.inspection_date)}</span>
                    </div>
                    {inspection.notes && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span className="truncate max-w-md">{inspection.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => router.push('/portal/qc/upload')}
            >
              <Upload className="h-6 w-6" />
              <span>Upload Report</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => router.push('/portal/qc/history')}
            >
              <ClipboardCheck className="h-6 w-6" />
              <span>View History</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => router.push('/portal/qc/settings')}
            >
              <FileText className="h-6 w-6" />
              <span>QC Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
