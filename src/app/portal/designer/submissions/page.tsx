'use client';
import { log } from '@/lib/logger';

import { useState } from 'react';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { LoadingState, EmptyState } from '@/components/common';
import {
  Upload,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Eye,
  Folder,
} from 'lucide-react';
import Link from 'next/link';

/**
 * Designer Submissions Page
 * Submit and track design deliverables
 */
export default function DesignerSubmissionsPage() {
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitForm, setSubmitForm] = useState({
    deliverableType: 'concept' as 'concept' | 'sketch' | 'render' | 'final_design' | 'technical_drawing' | 'other',
    notes: '',
  });

  // Queries
  const { data: submissionsData, isLoading, error, refetch } = api.portal.getDesignerSubmissions.useQuery();
  const submitDeliverableMutation = api.portal.submitDesignerDeliverable.useMutation();

  // Get tRPC utils
  const utils = api.useUtils();

  const projects = submissionsData?.projects || [];

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'not_started':
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Not Started
          </Badge>
        );
      case 'in_review':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            In Review
          </Badge>
        );
      case 'needs_revision':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Needs Revision
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Get deliverable status badge
  const getDeliverableStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Handle submission
  const handleSubmit = async () => {
    if (!selectedFile || !selectedProject) return;

    try {
      setUploading(true);

      // Upload to Supabase Storage
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const timestamp = Date.now();
      const filePath = `design-deliverables/${timestamp}-${selectedFile.name}`;

      const { data: _data, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        log.error('Storage upload error:', { uploadError });
        alert('Failed to upload file to storage');
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Submit deliverable
      await submitDeliverableMutation.mutateAsync({
        projectId: selectedProject,
        deliverableType: submitForm.deliverableType,
        fileName: selectedFile.name,
        fileUrl: urlData.publicUrl,
        fileSize: selectedFile.size,
        notes: submitForm.notes || undefined,
      });

      // Show success
      setSubmitSuccess(true);
      setSubmitDialogOpen(false);
      void utils.portal.getDesignerSubmissions.invalidate();

      // Reset form
      setTimeout(() => {
        setSubmitSuccess(false);
        setSelectedFile(null);
        setSelectedProject(null);
        setSubmitForm({
          deliverableType: 'concept',
          notes: '',
        });
      }, 2000);
    } catch (error) {
      log.error('Submit failed:', { error });
      alert('Failed to submit deliverable');
    } finally {
      setUploading(false);
    }
  };

  // Handle query error
  if (error) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Submissions</h1>
          <p className="page-subtitle">Submit and track your design deliverables</p>
        </div>
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load submissions"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => refetch(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading submissions..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Submissions</h1>
        <p className="page-subtitle">Submit and track your design deliverables</p>
      </div>

      {/* Success Message */}
      {submitSuccess && (
        <div className="flex items-center gap-2 p-4 bg-success/10 text-success border border-success/20 rounded-lg">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">Deliverable submitted successfully</span>
        </div>
      )}

      {/* Projects List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Active Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground">No active projects</p>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project: any) => (
                <div
                  key={project.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* Project Icon */}
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Folder className="h-6 w-6 text-primary" />
                  </div>

                  {/* Project Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{project.name}</h3>
                        {project.customers && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Client: {project.customers.name}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {getStatusBadge(project.submissionStatus)}
                          <Badge variant="outline">
                            {project.totalDeliverables} Deliverable{project.totalDeliverables !== 1 ? 's' : ''}
                          </Badge>
                          {project.approvedDeliverables > 0 && (
                            <Badge variant="default">
                              {project.approvedDeliverables} Approved
                            </Badge>
                          )}
                          {project.pendingDeliverables > 0 && (
                            <Badge variant="secondary">
                              {project.pendingDeliverables} Pending
                            </Badge>
                          )}
                          {project.rejectedDeliverables > 0 && (
                            <Badge variant="destructive">
                              {project.rejectedDeliverables} Needs Revision
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedProject(project.id);
                            setSubmitDialogOpen(true);
                          }}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Submit
                        </Button>
                        <Link href={`/portal/designer/projects/${project.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Recent Deliverables */}
                    {project.design_deliverables && project.design_deliverables.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Recent Submissions:</p>
                        <div className="space-y-1">
                          {project.design_deliverables.slice(0, 3).map((deliverable: any) => (
                            <div key={deliverable.id} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <FileText className="h-3 w-3 text-muted-foreground" />
                                <span>{deliverable.file_name}</span>
                                <span className="text-muted-foreground">v{deliverable.version}</span>
                              </div>
                              {getDeliverableStatusBadge(deliverable.status)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Dialog */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit Deliverable</DialogTitle>
            <DialogDescription>
              Upload a design deliverable for review
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* File Selection */}
            <div>
              <Label htmlFor="file">Design File *</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.ai,.psd,.sketch,.fig,.png,.jpg,.jpeg"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {/* Deliverable Type */}
            <div>
              <Label htmlFor="type">Deliverable Type *</Label>
              <Select
                value={submitForm.deliverableType}
                onValueChange={(value: any) =>
                  setSubmitForm({ ...submitForm, deliverableType: value })
                }
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concept">Concept Design</SelectItem>
                  <SelectItem value="sketch">Sketch/Ideation</SelectItem>
                  <SelectItem value="render">3D Render</SelectItem>
                  <SelectItem value="final_design">Final Design</SelectItem>
                  <SelectItem value="technical_drawing">Technical Drawing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add notes about this submission..."
                value={submitForm.notes}
                onChange={(e) =>
                  setSubmitForm({ ...submitForm, notes: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSubmitDialogOpen(false);
                setSelectedFile(null);
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedFile || uploading}
            >
              {uploading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Submit
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
