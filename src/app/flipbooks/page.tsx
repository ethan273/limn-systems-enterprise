"use client";

import { features } from "@/lib/features";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { Plus, BookOpen, Eye, Pencil, Trash2, Upload } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  PageHeader,
  EmptyState,
  LoadingState,
  DataTable,
  StatsGrid,
  type DataTableColumn,
  type DataTableFilter,
  type DataTableRowAction,
  type StatItem,
} from "@/components/common";
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

/**
 * Flipbooks Library Page
 *
 * Main landing page for the flipbooks feature.
 * Lists all flipbooks with filtering, sorting, and quick actions.
 *
 * FEATURE FLAG: Only accessible when features.flipbooks is enabled
 */
export default function FlipbooksPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [flipbookToDelete, setFlipbookToDelete] = useState<any>(null);

  // Redirect if feature is disabled
  useEffect(() => {
    if (!features.flipbooks) {
      router.push("/");
    }
  }, [router]);

  // Don't render if feature is disabled
  if (!features.flipbooks) {
    return null;
  }

  // Query flipbooks
  const { data, isLoading } = api.flipbooks.list.useQuery({
    limit: 50,
  });

  const flipbooks = data?.flipbooks || [];

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Delete mutation
  const deleteMutation = api.flipbooks.delete.useMutation({
    onSuccess: () => {
      toast.success("Flipbook deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['flipbooks'] });
      // Invalidate queries for instant updates
      utils.flipbooks.list.invalidate();
      setDeleteDialogOpen(false);
      setFlipbookToDelete(null);
    },
    onError: (error) => {
      toast.error("Failed to delete flipbook: " + error.message);
    },
  });

  const handleConfirmDelete = () => {
    if (flipbookToDelete) {
      deleteMutation.mutate({ id: flipbookToDelete.id });
    }
  };

  // Stats configuration
  const stats: StatItem[] = [
    {
      title: 'Total Flipbooks',
      value: flipbooks.length,
      description: 'All flipbooks',
      icon: BookOpen,
      iconColor: 'info',
    },
    {
      title: 'Published',
      value: flipbooks.filter((f: any) => f.status === 'PUBLISHED').length,
      description: 'Live flipbooks',
      icon: Eye,
      iconColor: 'success',
    },
    {
      title: 'Drafts',
      value: flipbooks.filter((f: any) => f.status === 'DRAFT').length,
      description: 'Work in progress',
      icon: Pencil,
      iconColor: 'warning',
    },
    {
      title: 'Total Views',
      value: flipbooks.reduce((sum: number, f: any) => sum + (f.view_count || 0), 0),
      description: 'All time views',
      icon: Eye,
      iconColor: 'info',
    },
  ];

  // DataTable columns configuration
  const columns: DataTableColumn<any>[] = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="data-table-avatar">
            <BookOpen className="icon-sm" aria-hidden="true" />
          </div>
          <div>
            <div className="font-medium">{row.title}</div>
            {row.description && (
              <div className="text-sm text-secondary line-clamp-1">
                {row.description}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const statusColors: Record<string, string> = {
          DRAFT: 'status-warning',
          PUBLISHED: 'status-success',
          ARCHIVED: 'status-muted',
        };
        return (
          <Badge variant="outline" className={statusColors[value as string] || ''}>
            {value as string}
          </Badge>
        );
      },
    },
    {
      key: 'page_count',
      label: 'Pages',
      sortable: true,
      render: (value) => (
        <span className="text-sm">{value || 0} pages</span>
      ),
    },
    {
      key: 'view_count',
      label: 'Views',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-1">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{value || 0}</span>
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value) => value ? (
        <span className="text-sm">
          {formatDistanceToNow(new Date(value as string), { addSuffix: true })}
        </span>
      ) : null,
    },
  ];

  // DataTable filters configuration
  const filters: DataTableFilter[] = [
    {
      key: 'search',
      label: 'Search flipbooks',
      type: 'search',
      placeholder: 'Search by title or description...',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'DRAFT', label: 'Draft' },
        { value: 'PUBLISHED', label: 'Published' },
        { value: 'ARCHIVED', label: 'Archived' },
      ],
    },
  ];

  // Row actions configuration
  const rowActions: DataTableRowAction<any>[] = [
    {
      label: 'View',
      icon: Eye,
      onClick: (row) => router.push(`/flipbooks/${row.id}`),
    },
    {
      label: 'Edit',
      icon: Pencil,
      onClick: (row) => router.push(`/flipbooks/builder?id=${row.id}`),
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      separator: true,
      onClick: (row) => {
        setFlipbookToDelete(row);
        setDeleteDialogOpen(true);
      },
    },
  ];

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader
        title="Flipbook Library"
        subtitle="Create and manage interactive flipbooks"
        actions={[
          {
            label: 'Upload PDF',
            icon: Upload,
            onClick: () => router.push("/flipbooks/upload"),
            variant: 'default',
          },
        ]}
      />

      {/* Stats Grid */}
      <StatsGrid stats={stats} columns={4} />

      {/* Flipbooks DataTable */}
      {isLoading ? (
        <LoadingState message="Loading flipbooks..." size="lg" />
      ) : !flipbooks || flipbooks.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No flipbooks found"
          description="Get started by uploading your first PDF."
          action={{
            label: 'Upload PDF',
            onClick: () => router.push("/flipbooks/upload"),
            icon: Upload,
          }}
        />
      ) : (
        <DataTable
          data={flipbooks}
          columns={columns}
          filters={filters}
          rowActions={rowActions}
          onRowClick={(row) => router.push(`/flipbooks/${row.id}`)}
          pagination={{ pageSize: 20, showSizeSelector: true }}
          emptyState={{
            icon: BookOpen,
            title: 'No flipbooks match your filters',
            description: 'Try adjusting your search or filter criteria',
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Flipbook</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{flipbookToDelete?.title}"? This action cannot be undone.
              All pages, hotspots, and analytics data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
