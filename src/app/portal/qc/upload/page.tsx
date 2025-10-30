'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  X,
  Link as LinkIcon,
} from 'lucide-react';

/**
 * QC Portal Upload Reports
 * Upload quality inspection reports and documentation with enhanced features
 */
export default function QCUploadPage() {
  const _router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [linkedInspectionId, setLinkedInspectionId] = useState<string>('');
  const [previewDialog, setPreviewDialog] = useState<{ open: boolean; url: string | null; type: string }>({
    open: false,
    url: null,
    type: '',
  });

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Fetch recent uploads
  const { data: recentUploads, isLoading: uploadsLoading } = api.portal.getRecentQCUploads.useQuery({
    limit: 10,
  });

  // Fetch pending inspections for linking
  const { data: inspectionsData } = api.portal.getQCInspections.useQuery({
    status: 'pending',
    limit: 50,
    offset: 0,
  });

  const inspections = inspectionsData?.inspections || [];

  // Create document mutation
  const createDocument = api.portal.createQCDocument.useMutation({
    onSuccess: () => {
      void utils.portal.getRecentQCUploads.invalidate();
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(Array.from(files));
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setUploading(true);
      setUploadError(null);
      setUploadProgress(0);

      // Upload files to Supabase Storage
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const totalFiles = selectedFiles.length;
      let completedFiles = 0;

      for (const file of selectedFiles) {
        // Generate unique file path: qc-reports/{timestamp}-{filename}
        const timestamp = Date.now();
        const filePath = `qc-reports/${timestamp}-${file.name}`;

        // Upload to Supabase Storage
        const { data: _data, error } = await supabase.storage
          .from('documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) {
          console.error('Upload error:', error);
          throw error;
        }

        // Determine document category based on file type
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        let category: 'inspection_report' | 'quality_certificate' | 'photos' | 'other' = 'other';

        if (fileExt === 'pdf' || fileExt === 'doc' || fileExt === 'docx') {
          category = 'inspection_report';
        } else if (fileExt === 'jpg' || fileExt === 'jpeg' || fileExt === 'png') {
          category = 'photos';
        }

        // Create database record
        await createDocument.mutateAsync({
          name: file.name,
          category,
          storagePath: filePath,
          storageBucket: 'documents',
          fileSize: file.size,
          mimeType: file.type,
          qualityInspectionId: linkedInspectionId || undefined,
        });

        completedFiles++;
        setUploadProgress(Math.round((completedFiles / totalFiles) * 100));
      }

      setUploadSuccess(true);
      setSelectedFiles([]);
      setLinkedInspectionId('');
      setTimeout(() => {
        setUploadSuccess(false);
        setUploadProgress(0);
      }, 5000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handlePreview = (doc: any) => {
    if (!doc.url) return;

    const fileExt = doc.name.split('.').pop()?.toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileExt || '');

    setPreviewDialog({
      open: true,
      url: doc.url,
      type: isImage ? 'image' : 'document',
    });
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Helper function to format date
  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper function to get category badge variant
  const getCategoryVariant = (category: string | null) => {
    switch (category) {
      case 'inspection_report':
        return 'default';
      case 'quality_certificate':
        return 'secondary';
      case 'photos':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Upload Reports</h1>
        <p className="page-subtitle">Upload quality inspection reports and documentation</p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Inspection Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Link to Inspection */}
            <div>
              <Label htmlFor="inspection">Link to Inspection (Optional)</Label>
              <Select value={linkedInspectionId} onValueChange={setLinkedInspectionId}>
                <SelectTrigger id="inspection">
                  <SelectValue placeholder="Select an inspection..." />
                </SelectTrigger>
                <SelectContent>
                  {inspections.map((inspection) => (
                    <SelectItem key={inspection.id} value={inspection.id}>
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4" />
                        {inspection.manufacturer_projects?.project_name || `Inspection ${inspection.id.substring(0, 8)}`}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Link uploaded files to a specific quality inspection
              </p>
            </div>

            {/* File Upload Area */}
            <div className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileSelect}
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-4"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-medium mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-muted-foreground">
                    PDF, DOC, DOCX, JPG, PNG up to 10MB
                  </p>
                </div>
                <Button type="button" variant="outline" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Select Files'}
                </Button>
              </label>
            </div>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Files ({selectedFiles.length})</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveFile(index)}
                        disabled={uploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={handleFileUpload}
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Uploading {uploadProgress}%...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading files...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            {/* Success Message */}
            {uploadSuccess && (
              <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-success" />
                <div>
                  <p className="font-medium">Upload successful!</p>
                  <p className="text-sm text-muted-foreground">
                    Your {selectedFiles.length > 1 ? 'reports have' : 'report has'} been uploaded and saved to the database.
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {uploadError && (
              <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium">Upload failed</p>
                  <p className="text-sm text-muted-foreground">
                    {uploadError}
                  </p>
                </div>
              </div>
            )}

            {/* Upload Guidelines */}
            <div className="space-y-3">
              <h3 className="font-semibold">Upload Guidelines</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-success" />
                  <span>Ensure all inspection details are clearly documented</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-success" />
                  <span>Include photos of any defects or issues found</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-success" />
                  <span>Use descriptive file names (e.g., &quot;Project-Name-QC-Report-2024-01-15.pdf&quot;)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-success" />
                  <span>Maximum file size: 10MB per file</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-success" />
                  <span>Accepted formats: PDF, DOC, DOCX, JPG, PNG</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Uploads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Uploads
          </CardTitle>
        </CardHeader>
        <CardContent>
          {uploadsLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading uploads...</p>
            </div>
          ) : recentUploads && recentUploads.documents.length > 0 ? (
            <div className="space-y-3">
              {recentUploads.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.name}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span>{formatDate(doc.created_at)}</span>
                        <Badge variant={getCategoryVariant(doc.category)}>
                          {doc.category?.replace('_', ' ') || 'Other'}
                        </Badge>
                        {doc.quality_inspections && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <LinkIcon className="h-3 w-3" />
                            Linked
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handlePreview(doc)}
                      disabled={!doc.url}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (doc.download_url) {
                          window.open(doc.download_url, '_blank');
                        }
                      }}
                      disabled={!doc.download_url}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
              <p className="text-muted-foreground">No recent uploads</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your uploaded reports will appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Need Help?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            If you&apos;re having trouble uploading reports or have questions about the inspection process,
            please contact your administrator.
          </p>
          <Button variant="outline">
            Contact Support
          </Button>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewDialog.open} onOpenChange={(open) => setPreviewDialog({ ...previewDialog, open })}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[70vh]">
            {previewDialog.type === 'image' && previewDialog.url && (
              <img
                src={previewDialog.url}
                alt="Document preview"
                className="w-full h-auto"
              />
            )}
            {previewDialog.type === 'document' && previewDialog.url && (
              <div className="text-center py-12">
                <FileText className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Preview not available for this document type
                </p>
                <Button
                  onClick={() => window.open(previewDialog.url!, '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
