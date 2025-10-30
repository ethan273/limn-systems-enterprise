'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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

  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [updateForm, setUpdateForm] = useState({
    passed: 'true',
    defectsFound: '0',
    notes: '',
  });

  const { data: inspection, isLoading, error } = api.portal.getQCInspectionById.useQuery(
    { inspectionId },
    { enabled: !!inspectionId }
  );

  const updateStatusMutation = api.portal.updateQCInspectionStatus.useMutation();

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

  const handleUpdateStatus = () => {
    if (inspection) {
      setUpdateForm({
        passed: inspection.passed === null ? 'true' : inspection.passed ? 'true' : 'false',
        defectsFound: String(inspection.defects_found || 0),
        notes: inspection.notes || '',
      });
      setUpdateDialogOpen(true);
    }
  };

  const handleSubmitUpdate = async () => {
    try {
      setSubmitting(true);

      await updateStatusMutation.mutateAsync({
        inspectionId,
        passed: updateForm.passed === 'true',
        defectsFound: parseInt(updateForm.defectsFound, 10),
        notes: updateForm.notes || undefined,
      });

      // Show success
      setSuccessMessage('Inspection status updated successfully');
      setUpdateDialogOpen(false);
      void utils.portal.getQCInspectionById.invalidate();

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Failed to update inspection:', error);
      alert('Failed to update inspection status');
    } finally {
      setSubmitting(false);
    }
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

      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-2 p-4 bg-success/10 text-success border border-success/20 rounded-lg">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

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
            <Button onClick={handleUpdateStatus}>
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Update Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Update Status Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Inspection Status</DialogTitle>
            <DialogDescription>
              Update the inspection results and quality status
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Pass/Fail Status */}
            <div>
              <Label>Inspection Result</Label>
              <RadioGroup
                value={updateForm.passed}
                onValueChange={(value) =>
                  setUpdateForm({ ...updateForm, passed: value })
                }
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="passed" />
                  <Label htmlFor="passed" className="cursor-pointer flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Passed - Quality meets standards
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="failed" />
                  <Label htmlFor="failed" className="cursor-pointer flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    Failed - Quality issues found
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Defects Found */}
            <div>
              <Label htmlFor="defects">Number of Defects Found</Label>
              <Input
                id="defects"
                type="number"
                min="0"
                value={updateForm.defectsFound}
                onChange={(e) =>
                  setUpdateForm({ ...updateForm, defectsFound: e.target.value })
                }
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="update-notes">Inspection Notes</Label>
              <Textarea
                id="update-notes"
                placeholder="Add detailed inspection notes..."
                value={updateForm.notes}
                onChange={(e) =>
                  setUpdateForm({ ...updateForm, notes: e.target.value })
                }
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUpdateDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitUpdate}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Update Status
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
