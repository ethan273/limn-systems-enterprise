'use client';

import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import {
  ClipboardCheck,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  ArrowLeft,
  User,
  RefreshCw,
} from 'lucide-react';

/**
 * QC Portal Inspection Detail
 * Displays full details of a quality inspection
 */
export default function QCInspectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const utils = api.useUtils();
  const inspectionId = params?.id as string;

  const { data: inspection, isLoading, error } = api.portal.getQCInspectionById.useQuery(
    { inspectionId },
    { enabled: !!inspectionId }
  );

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (passed: boolean | null) => {
    if (passed === null) {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          Pending
        </Badge>
      );
    }
    return passed ? (
      <Badge className="badge-success flex items-center gap-1">
        <CheckCircle className="h-4 w-4" />
        Passed
      </Badge>
    ) : (
      <Badge className="badge-error flex items-center gap-1">
        <AlertTriangle className="h-4 w-4" />
        Failed
      </Badge>
    );
  };

  // Handle query error
  if (error) {
    return (
      <div className="space-y-6">
        <div className="page-header">
          <h1 className="page-title">Inspection Details</h1>
          <p className="page-subtitle">Quality control inspection information</p>
        </div>
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load inspection"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.portal.getQCInspectionById.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="page-header">
          <h1 className="page-title">Loading Inspection...</h1>
        </div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={ClipboardCheck}
          title="Inspection not found"
          description="This inspection does not exist or you don't have access to view it"
          action={{
            label: 'Back to Inspections',
            onClick: () => router.push('/portal/qc/inspections'),
            icon: ArrowLeft,
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/portal/qc/inspections')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="page-title">
              {inspection.manufacturer_projects?.project_name || 'Quality Inspection'}
            </h1>
            <p className="page-subtitle">Inspection Details</p>
          </div>
          {getStatusBadge(inspection.passed)}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inspection Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{formatDate(inspection.inspection_date)}</div>
            <p className="text-xs text-muted-foreground">Date performed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Defects Found</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inspection.defects_found || 0}</div>
            <p className="text-xs text-muted-foreground">Issues identified</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inspector</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{inspection.inspector_name || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">QC Tester</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Inspection Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Inspection Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Project:</div>
              <div className="font-medium">
                {inspection.manufacturer_projects?.project_name || 'N/A'}
              </div>

              <div className="text-muted-foreground">Status:</div>
              <div>{getStatusBadge(inspection.passed)}</div>

              <div className="text-muted-foreground">Inspection Date:</div>
              <div className="font-medium">{formatDate(inspection.inspection_date)}</div>

              <div className="text-muted-foreground">Defects Found:</div>
              <div className={`font-medium ${(inspection.defects_found || 0) > 0 ? 'text-destructive' : 'text-success'}`}>
                {inspection.defects_found || 0}
              </div>

              <div className="text-muted-foreground">Inspector:</div>
              <div className="font-medium">{inspection.inspector_name || 'N/A'}</div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Inspection Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {inspection.notes ? (
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {inspection.notes}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic text-center py-8">
                No notes provided for this inspection
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Defect Details */}
      {(inspection.defects_found || 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Defects Identified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-destructive mb-2">
                  {inspection.defects_found}
                </div>
                <p className="text-sm text-muted-foreground">
                  {inspection.defects_found === 1 ? 'Defect' : 'Defects'} found during inspection
                </p>
                {inspection.notes && (
                  <p className="text-sm text-muted-foreground mt-4 max-w-md">
                    See inspection notes above for details
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/portal/qc/inspections')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inspections
            </Button>
            {inspection.passed === null && (
              <Button>
                Update Status
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
