"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api/client";
import { BookOpen, Eye, Pencil, Trash2, Upload, AlertTriangle, RefreshCw, CheckSquare, Copy, Archive } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useTableFilters } from "@/hooks/useTableFilters";
import {
  PageHeader,
  EmptyState,
  LoadingState,
  DataTable,
  StatsGrid,
  TableFilters,
  type DataTableColumn,
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

  // Bulk operations state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  // Unified filter management with new hook (must be before conditional returns)
  const {
    rawFilters,
    setFilter,
    clearFilters,
    hasActiveFilters,
    filters,
  } = useTableFilters({
    initialFilters: {
      search: '',
      status: '' as '' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
    },
    debounceMs: 300,
  });

  // Build query params for flipbooks API (uses cursor, not offset)
  // FIXME: status filter removed - Unsupported type in Prisma
  const queryParams: {
    search?: string;
    // status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    limit: number;
  } = {
    search: filters.search || undefined,
    // FIXME: status filter disabled - Unsupported type in Prisma
    // status: (filters.status === '' ? undefined : filters.status) as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | undefined,
    limit: 50,
  };

  // Query flipbooks with unified params
  const { data, isLoading, error } = api.flipbooks.list.useQuery(queryParams);

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

  // Bulk delete mutation
  const bulkDeleteMutation = api.flipbooks.bulkDelete.useMutation({
    onSuccess: (result) => {
      toast.success(`Deleted ${result.deletedCount} flipbook(s)`);
      queryClient.invalidateQueries({ queryKey: ['flipbooks'] });
      utils.flipbooks.list.invalidate();
      setSelectedIds(new Set());
      setBulkDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to delete flipbooks: " + error.message);
    },
  });

  // FIXME: bulkUpdateStatus mutation disabled - status field is Unsupported type in Prisma
  // const bulkUpdateStatusMutation = api.flipbooks.bulkUpdateStatus.useMutation({
  //   onSuccess: (result) => {
  //     toast.success(`Updated ${result.updatedCount} flipbook(s)`);
  //     queryClient.invalidateQueries({ queryKey: ['flipbooks'] });
  //     utils.flipbooks.list.invalidate();
  //     setSelectedIds(new Set());
  //   },
  //   onError: (error) => {
  //     toast.error("Failed to update flipbooks: " + error.message);
  //   },
  // });

  // Bulk duplicate mutation
  const bulkDuplicateMutation = api.flipbooks.bulkDuplicate.useMutation({
    onSuccess: (result) => {
      toast.success(`Duplicated ${result.duplicatedCount} flipbook(s)`);
      queryClient.invalidateQueries({ queryKey: ['flipbooks'] });
      utils.flipbooks.list.invalidate();
      setSelectedIds(new Set());
    },
    onError: (error) => {
      toast.error("Failed to duplicate flipbooks: " + error.message);
    },
  });

  // Bulk operation handlers
  const _handleSelectAll = () => {
    if (selectedIds.size === flipbooks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(flipbooks.map((f: any) => f.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = () => {
    setBulkDeleteDialogOpen(true);
  };

  const handleConfirmBulkDelete = () => {
    bulkDeleteMutation.mutate({ ids: Array.from(selectedIds) });
  };

  // FIXME: Bulk publish/archive disabled - status field is Unsupported type in Prisma
  // const handleBulkPublish = () => {
  //   bulkUpdateStatusMutation.mutate({ ids: Array.from(selectedIds), status: "PUBLISHED" });
  // };

  // const handleBulkArchive = () => {
  //   bulkUpdateStatusMutation.mutate({ ids: Array.from(selectedIds), status: "ARCHIVED" });
  // };

  const handleBulkDuplicate = () => {
    bulkDuplicateMutation.mutate({ ids: Array.from(selectedIds) });
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
    // FIXME: Published/Draft counts disabled - status field is Unsupported type in Prisma
    // {
    //   title: 'Published',
    //   value: flipbooks.filter((f: any) => f.status === 'PUBLISHED').length,
    //   description: 'Live flipbooks',
    //   icon: Eye,
    //   iconColor: 'success',
    // },
    // {
    //   title: 'Drafts',
    //   value: flipbooks.filter((f: any) => f.status === 'DRAFT').length,
    //   description: 'Work in progress',
    //   icon: Pencil,
    //   iconColor: 'warning',
    // },
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
      key: 'select',
      label: '', // Empty label for checkbox column
      render: (_, row) => (
        <Checkbox
          checked={selectedIds.has(row.id)}
          onCheckedChange={() => handleSelectOne(row.id)}
          aria-label={`Select ${row.title}`}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
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
        <span className="text-sm">{(value as number) || 0} pages</span>
      ),
    },
    {
      key: 'view_count',
      label: 'Views',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-1">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{(value as number) || 0}</span>
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

  // Status filter options
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'PUBLISHED', label: 'Published' },
    { value: 'ARCHIVED', label: 'Archived' },
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

  // Handle query error
  if (error) {
    return (
      <div className="page-container">
        <PageHeader
          title="Flipbook Library"
          subtitle="Create and manage interactive flipbooks"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load flipbooks"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.flipbooks.list.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

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

      {/* Filters - New Unified System */}
      <TableFilters.Bar
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      >
        {/* Search Filter */}
        <TableFilters.Search
          value={rawFilters.search}
          onChange={(value) => setFilter('search', value)}
          placeholder="Search by title or description..."
        />

        {/* FIXME: Status Filter disabled - status field is Unsupported type in Prisma */}
        {/* <TableFilters.Select
          value={rawFilters.status}
          onChange={(value) => setFilter('status', value as '' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED')}
          options={statusOptions}
          placeholder="All Statuses"
        /> */}
      </TableFilters.Bar>

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div className="bg-card border rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              <span className="font-medium">
                {selectedIds.size} flipbook{selectedIds.size !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* FIXME: Bulk publish/archive buttons disabled - status field is Unsupported type in Prisma */}
              {/* <Button
                variant="outline"
                size="sm"
                onClick={handleBulkPublish}
                disabled={bulkUpdateStatusMutation.isPending}
              >
                <Eye className="h-4 w-4 mr-2" />
                Publish
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkArchive}
                disabled={bulkUpdateStatusMutation.isPending}
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </Button> */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDuplicate}
                disabled={bulkDuplicateMutation.isPending}
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Flipbooks DataTable - No filters prop (server-side only) */}
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
              Are you sure you want to delete &quot;{flipbookToDelete?.title}&quot;? This action cannot be undone.
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

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} Flipbook{selectedIds.size !== 1 ? 's' : ''}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.size} flipbook{selectedIds.size !== 1 ? 's' : ''}? This action cannot be undone.
              All pages, hotspots, and analytics data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? 'Deleting...' : 'Delete All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
