"use client";

/**
 * Design Documents Library Page
 *
 * Integrated with hybrid storage system (Supabase + Google Drive).
 * Week 13-15 Day 9: Updated with real API integration.
 */

import { useState, Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import {
  PageHeader,
  DataTable,
  StatsGrid,
  EmptyState,
  LoadingState,
  TableFilters,
  type DataTableColumn,
  type DataTableRowAction,
  type StatItem,
} from "@/components/common";
import { useTableState } from "@/hooks/useTableFilters";
import {
  Upload,
  FileText,
  Eye,
  HardDrive,
  Cloud,
  Trash2,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { FileUploader } from "@/components/design/FileUploader";
import { formatFileSize } from "@/lib/storage/hybrid-storage";

export const dynamic = 'force-dynamic';

function DesignDocumentsContent() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<any>(null);

  // Get current user from tRPC (standardized auth pattern)
  const { data: _currentUser, isLoading: authLoading } = api.userProfile.getCurrentUser.useQuery();

  // Unified filter management with new hook
  const {
    rawFilters,
    setFilter,
    clearFilters,
    hasActiveFilters,
    queryParams,
  } = useTableState({
    initialFilters: {
      search: '',
      storageType: '',
      category: '',
    },
    debounceMs: 300,
    pageSize: 100,
  });

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Get Google Drive service account status
  const { data: driveStatus, error: driveStatusError } = api.storage.getDriveStatus.useQuery();

  // Get files list with unified params
  const {
    data: filesData,
    isLoading: filesLoading,
    error: filesError,
    refetch: refetchFiles,
  } = api.storage.listFiles.useQuery({
    ...queryParams,
    storageType: rawFilters.storageType || undefined,
  });

  // Get storage stats
  const { data: stats, error: statsError } = api.storage.getStorageStats.useQuery();

  // Delete file mutation
  const deleteFile = api.storage.deleteFile.useMutation({
    onSuccess: () => {
      toast.success("Document deleted successfully");
      void refetchFiles();
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    },
    onError: (error) => {
      toast.error("Failed to delete document: " + error.message);
    },
  });

  // Auth is handled by middleware - no client-side redirect needed

  const handleConfirmDelete = () => {
    if (fileToDelete) {
      void deleteFile.mutateAsync({ fileId: fileToDelete.id });
    }
  };

  const getStorageBadge = (storageType: string) => {
    switch (storageType) {
      case 'supabase':
        return (
          <Badge variant="outline" className="badge-info">
            <HardDrive className="mr-1 h-3 w-3" />
            Supabase
          </Badge>
        );
      case 'google_drive':
        return (
          <Badge variant="outline" className="badge-active">
            <Cloud className="mr-1 h-3 w-3" />
            Google Drive
          </Badge>
        );
      default:
        return <Badge variant="outline">{storageType}</Badge>;
    }
  };

  // Auth is handled by middleware - no need for client-side checks
  // Show loading state only during initial auth check
  if (authLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading..." size="lg" />
      </div>
    );
  }

  // Error handling - show error state with retry
  if (filesError || statsError || driveStatusError) {
    const error = filesError || statsError || driveStatusError;
    return (
      <div className="page-container">
        <PageHeader
          title="Documents Library"
          subtitle="Manage design documents across Supabase and Google Drive"
        />
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <h2 className="text-2xl font-bold">Failed to Load Documents</h2>
          <p className="text-muted-foreground text-center max-w-md">
            {error?.message || "An error occurred while loading documents."}
          </p>
          <Button onClick={() => {
            utils.storage.listFiles.invalidate();
            utils.storage.getStorageStats.invalidate();
            utils.storage.getDriveStatus.invalidate();
          }}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const files = filesData?.files || [];

  // Stats configuration
  const statsItems: StatItem[] = [
    {
      title: 'Total Documents',
      value: stats?.total.files || 0,
      description: formatFileSize(stats?.total.size || 0),
      icon: FileText,
      iconColor: 'primary',
    },
    {
      title: 'Supabase',
      value: stats?.supabase.files || 0,
      description: formatFileSize(stats?.supabase.size || 0),
      icon: HardDrive,
      iconColor: 'info',
    },
    {
      title: 'Google Drive',
      value: stats?.googleDrive.files || 0,
      description: formatFileSize(stats?.googleDrive.size || 0),
      icon: Cloud,
      iconColor: 'success',
    },
    {
      title: 'Average Size',
      value: stats && stats.total.files > 0
        ? formatFileSize(Math.floor(stats.total.size / stats.total.files))
        : '0 B',
      description: 'Per file',
      icon: FileText,
    },
  ];

  // DataTable columns configuration
  const columns: DataTableColumn<any>[] = [
    {
      key: 'file_name',
      label: 'File Name',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{value as string}</span>
        </div>
      ),
    },
    {
      key: 'file_type',
      label: 'Category',
      render: (value) => <Badge variant="outline">{(value as string) || 'file'}</Badge>,
    },
    {
      key: 'file_size',
      label: 'Size',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-muted-foreground">
          {formatFileSize((value as number) || 0)}
        </span>
      ),
    },
    {
      key: 'storage_type',
      label: 'Storage',
      render: (value) => getStorageBadge((value as string) || 'supabase'),
    },
    {
      key: 'created_at',
      label: 'Upload Date',
      sortable: true,
      render: (value) => (
        <span className="text-sm">
          {new Date((value as string) || new Date()).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'users',
      label: 'Uploaded By',
      render: (value) => (
        <span className="text-sm text-muted-foreground">
          {(value as any)?.email || 'Unknown'}
        </span>
      ),
    },
  ];

  // Filter options for TableFilters components
  const storageTypeOptions = [
    { value: '', label: 'All Storage' },
    { value: 'supabase', label: 'Supabase' },
    { value: 'google_drive', label: 'Google Drive' },
  ];

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'image', label: 'Images' },
    { value: 'document', label: 'Documents' },
    { value: 'pdf', label: 'PDFs' },
    { value: 'video', label: 'Videos' },
    { value: 'file', label: 'Other Files' },
  ];

  // Row actions configuration
  const rowActions: DataTableRowAction<any>[] = [
    {
      label: 'View',
      icon: Eye,
      onClick: (row) => {
        if (row.google_drive_url) {
          window.open(row.google_drive_url, '_blank');
        }
      },
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      separator: true,
      onClick: (row) => {
        setFileToDelete(row);
        setDeleteDialogOpen(true);
      },
    },
  ];

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader
        title="Documents Library"
        subtitle="Manage design documents across Supabase and Google Drive"
        actions={[
          {
            label: 'Upload Document',
            icon: Upload,
            onClick: () => setUploadDialogOpen(true),
          },
        ]}
      />

      {/* Google Drive Status - Service Account */}
      {driveStatus && !driveStatus.connected && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <span>
              Google Drive not configured. Service account setup required for files ≥50MB.
              {driveStatus.errors && driveStatus.errors.length > 0 && (
                <span className="block text-xs mt-1 text-muted-foreground">
                  {driveStatus.errors.join(', ')}
                </span>
              )}
            </span>
          </AlertDescription>
        </Alert>
      )}

      {driveStatus && driveStatus.connected && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <span>
              Google Drive connected via service account - ready for large file uploads
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Stats */}
      <StatsGrid stats={statsItems} columns={4} />

      {/* Filters - New Unified System */}
      <TableFilters.Bar
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      >
        {/* Search Filter */}
        <TableFilters.Search
          value={rawFilters.search}
          onChange={(value) => setFilter('search', value)}
          placeholder="Search by file name..."
        />

        {/* Storage Type Filter */}
        <TableFilters.Select
          value={rawFilters.storageType}
          onChange={(value) => setFilter('storageType', value)}
          options={storageTypeOptions}
          placeholder="All Storage"
        />

        {/* Category Filter */}
        <TableFilters.Select
          value={rawFilters.category}
          onChange={(value) => setFilter('category', value)}
          options={categoryOptions}
          placeholder="All Categories"
        />
      </TableFilters.Bar>

      {/* Documents DataTable - No filters prop (server-side only) */}
      {filesLoading ? (
        <LoadingState message="Loading documents..." size="lg" />
      ) : files.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents found"
          description="Upload your first document to get started."
          action={{
            label: 'Upload Document',
            onClick: () => setUploadDialogOpen(true),
            icon: Upload,
          }}
        />
      ) : (
        <DataTable
          data={files}
          columns={columns}
          rowActions={rowActions}
          pagination={{ pageSize: 20, showSizeSelector: true }}
          emptyState={{
            icon: FileText,
            title: 'No documents match your filters',
            description: 'Try adjusting your search or filter criteria',
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{fileToDelete?.file_name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteFile.isPending}
            >
              {deleteFile.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
            <DialogDescription>
              Upload files to your document library. Files under 50MB are stored in Supabase,
              files 50MB and larger are stored in Google Drive.
            </DialogDescription>
          </DialogHeader>

          <FileUploader
            onUploadComplete={() => {
              setUploadDialogOpen(false);
              void refetchFiles();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DesignDocumentsPage() {
  return (
    <Suspense fallback={
      <div className="page-container">
        <LoadingState message="Loading..." size="lg" />
      </div>
    }>
      <DesignDocumentsContent />
    </Suspense>
  );
}
