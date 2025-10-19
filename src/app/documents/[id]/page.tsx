"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  EntityDetailHeader,
  InfoCard,
  LoadingState,
  EmptyState,
  type EntityMetadata,
} from "@/components/common";
import {
  FileText,
  AlertCircle,
  ArrowLeft,
  Download,
  File,
  Calendar,
  HardDrive,
  AlertTriangle,
  RefreshCw,
  Edit,
  Trash,
  Save,
  X,
} from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

const documentTypeConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  invoice: {
    label: "Invoice",
    className: "bg-info-muted text-info border-info",
    icon: <FileText className="w-4 h-4" aria-hidden="true" />,
  },
  contract: {
    label: "Contract",
    className: "bg-primary-muted text-primary border-primary",
    icon: <File className="w-4 h-4" aria-hidden="true" />,
  },
  drawing: {
    label: "Drawing",
    className: "bg-success-muted text-success border-success",
    icon: <File className="w-4 h-4" aria-hidden="true" />,
  },
  photo: {
    label: "Photo",
    className: "bg-warning-muted text-warning border-warning",
    icon: <File className="w-4 h-4" aria-hidden="true" />,
  },
  other: {
    label: "Other",
    className: "badge-neutral",
    icon: <File className="w-4 h-4" aria-hidden="true" />,
  },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DocumentDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editFormData, setEditFormData] = useState({
    fileName: "",
    category: "",
  });

  // Fetch document details - using storage router (matches list page)
  const { data: documentData, isLoading, error } = api.storage.getFile.useQuery(
    { fileId: id },
    { enabled: !!id }
  );

  const utils = api.useUtils();
  const document = documentData as any;

  // Mutations
  const updateFileMutation = api.storage.updateFile.useMutation({
    onSuccess: () => {
      void utils.storage.getFile.invalidate({ fileId: id });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Document updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update document",
        variant: "destructive",
      });
    },
  });

  const deleteFileMutation = api.storage.deleteFile.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
      router.push("/documents");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    },
  });

  // Map database fields to expected structure
  const mappedDocument = document ? {
    ...document,
    url: document.file_url || document.google_drive_url,
    name: document.file_name,
    type: document.file_type,
    size: document.file_size,
  } : null;

  // Handler functions
  const handleEditClick = () => {
    if (mappedDocument) {
      setEditFormData({
        fileName: mappedDocument.name || "",
        category: mappedDocument.category || "",
      });
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({
      fileName: "",
      category: "",
    });
  };

  const handleSaveEdit = () => {
    updateFileMutation.mutate({
      fileId: id,
      fileName: editFormData.fileName,
      category: editFormData.category,
    });
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    deleteFileMutation.mutate({ fileId: id });
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading document details..." size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="page-header">
          <Button variant="ghost" onClick={() => router.push("/documents")} className="btn-secondary">
            <ArrowLeft className="icon-sm" aria-hidden="true" />
            Back
          </Button>
        </div>
        <div className="error-state">
          <AlertTriangle className="error-state-icon" aria-hidden="true" />
          <h3 className="error-state-title">Failed to Load Document</h3>
          <p className="error-state-description">{error.message}</p>
          <button
            onClick={() => void utils.storage.getFile.invalidate()}
            className="btn-primary mt-4"
          >
            <RefreshCw className="icon-sm" aria-hidden="true" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!mappedDocument) {
    return (
      <div className="page-container">
        <EmptyState
          icon={AlertCircle}
          title="Document Not Found"
          description="The document you're looking for doesn't exist or you don't have permission to view it."
          action={{
            label: 'Back to Documents',
            onClick: () => router.push("/documents"),
            icon: ArrowLeft,
          }}
        />
      </div>
    );
  }

  // Determine document type from file type or document_type field
  const getDocType = (doc: any): string => {
    if (doc?.document_type) return doc.document_type;
    if (doc?.file_type?.includes('pdf')) return 'invoice';
    if (doc?.file_type?.includes('image')) return 'photo';
    if (doc?.type?.includes('pdf')) return 'invoice';
    if (doc?.type?.includes('image')) return 'photo';
    return 'other';
  };

  const typeConfig = documentTypeConfig[getDocType(mappedDocument)] || documentTypeConfig.other;

  // Calculate file size display
  const formatFileSize = (bytes: number | bigint | null | undefined) => {
    if (!bytes) return 'N/A';
    const numBytes = Number(bytes);
    if (numBytes < 1024) return `${numBytes} B`;
    if (numBytes < 1024 * 1024) return `${(numBytes / 1024).toFixed(1)} KB`;
    return `${(numBytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const metadata: EntityMetadata[] = [
    { icon: Calendar, value: mappedDocument.created_at ? format(new Date(mappedDocument.created_at), "MMM dd, yyyy") : "N/A", label: 'Created' },
    { icon: HardDrive, value: formatFileSize(mappedDocument.size), label: 'Size' },
    { icon: File, value: mappedDocument.type || "N/A", label: 'Type' },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <Button variant="ghost" onClick={() => router.push("/documents")} className="btn-secondary">
          <ArrowLeft className="icon-sm" aria-hidden="true" />
          Back
        </Button>
      </div>

      <EntityDetailHeader
        icon={FileText}
        title={mappedDocument.name || "Document"}
        subtitle={typeConfig.label}
        metadata={metadata}
        status={typeConfig.label}
        actions={
          isEditing
            ? [
                {
                  label: 'Save',
                  icon: Save,
                  onClick: handleSaveEdit,
                  variant: 'default' as const,
                },
                {
                  label: 'Cancel',
                  icon: X,
                  onClick: handleCancelEdit,
                  variant: 'secondary' as const,
                },
              ]
            : [
                ...(mappedDocument.url
                  ? [
                      {
                        label: 'Download',
                        icon: Download,
                        onClick: () => window.open(mappedDocument.url, '_blank'),
                      },
                    ]
                  : []),
                {
                  label: 'Edit',
                  icon: Edit,
                  onClick: handleEditClick,
                },
                {
                  label: 'Delete',
                  icon: Trash,
                  onClick: handleDeleteClick,
                  variant: 'destructive' as const,
                },
              ]
        }
      />

      {/* Document Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {isEditing ? (
          <Card>
            <CardHeader>
              <CardTitle>Document Information (Editing)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fileName">Document Name</Label>
                <Input
                  id="fileName"
                  value={editFormData.fileName}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, fileName: e.target.value })
                  }
                  placeholder="Enter document name"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={editFormData.category}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, category: e.target.value })
                  }
                  placeholder="Enter category (e.g., invoice, contract)"
                />
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Read-only fields:</p>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">File Type:</span>
                    <span>{mappedDocument.type || "N/A"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">File Size:</span>
                    <span>{formatFileSize(mappedDocument.size)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Upload Date:</span>
                    <span>
                      {mappedDocument.created_at
                        ? format(new Date(mappedDocument.created_at), "MMM dd, yyyy 'at' h:mm a")
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <InfoCard
            title="Document Information"
            items={[
              { label: 'Document Name', value: mappedDocument.name || "N/A" },
              { label: 'Category', value: mappedDocument.category || "N/A" },
              { label: 'File Type', value: mappedDocument.type || "N/A" },
              { label: 'File Size', value: formatFileSize(mappedDocument.size) },
              { label: 'Upload Date', value: mappedDocument.created_at ? format(new Date(mappedDocument.created_at), "MMM dd, yyyy 'at' h:mm a") : "N/A" },
              { label: 'Version', value: '1.0' },
            ]}
          />
        )}

        <InfoCard
          title="Metadata"
          items={[
            { label: 'Uploaded By', value: mappedDocument.users?.email || 'N/A' },
            { label: 'Last Modified', value: mappedDocument.created_at ? format(new Date(mappedDocument.created_at), "MMM dd, yyyy") : "N/A" },
            { label: 'URL', value: mappedDocument.url ? <a href={mappedDocument.url} target="_blank" rel="noopener noreferrer" className="text-info hover:underline">View File</a> : 'N/A' },
          ]}
        />
      </div>

      {/* Document Preview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Document Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {mappedDocument.url ? (
            <div className="space-y-4">
              {mappedDocument.type === 'application/pdf' ? (
                <iframe
                  src={mappedDocument.url}
                  className="w-full h-[600px] border rounded"
                  title="Document Preview"
                />
              ) : mappedDocument.type?.startsWith('image/') ? (
                <div className="relative w-full" style={{ minHeight: '400px' }}>
                  <Image
                    src={mappedDocument.url}
                    alt={mappedDocument.name || "Document"}
                    width={800}
                    height={600}
                    className="rounded border object-contain"
                    style={{ width: '100%', height: 'auto' }}
                  />
                </div>
              ) : (
                <Alert>
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  <AlertDescription>
                    Preview not available for this file type. Please download to view.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No file available for preview</p>
          )}
        </CardContent>
      </Card>

      {/* Related Records */}
      <Card>
        <CardHeader>
          <CardTitle>Related Records</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No related records available</p>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{mappedDocument.name}" and remove it from storage.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
