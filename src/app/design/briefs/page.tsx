"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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
import { Plus, FileText, Calendar, Pencil, Trash2, AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";
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

export const dynamic = 'force-dynamic';

export default function DesignBriefsPage() {
  // Get current user from tRPC (standardized auth pattern)
  const { data: _currentUser, isLoading: authLoading } = api.userProfile.getCurrentUser.useQuery();

  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [briefToDelete, setBriefToDelete] = useState<any>(null);

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
      status: '',
    },
    debounceMs: 300,
    pageSize: 50,
  });

  // Backend query with unified params
  const { data, isLoading, error } = api.designBriefs.getAll.useQuery(
    queryParams,
    { enabled: true } // Middleware ensures auth
  );

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  const deleteBrief = api.designBriefs.delete.useMutation({
    onSuccess: () => {
      toast.success("Design brief deleted successfully");
      // Invalidate queries for instant updates
      utils.designBriefs.getAll.invalidate();
      setDeleteDialogOpen(false);
      setBriefToDelete(null);
    },
    onError: (error) => {
      toast.error("Failed to delete design brief: " + error.message);
    },
  });

  const handleConfirmDelete = () => {
    if (briefToDelete) {
      deleteBrief.mutate({ id: briefToDelete.id });
    }
  };

  const filteredBriefs = data?.briefs || [];

  const getStatusBadge = (brief: any) => {
    const hasProject = !!brief.design_projects;
    const isApproved = !!brief.approved_by;

    if (!hasProject) {
      return <Badge variant="outline" className="badge-neutral">Draft</Badge>;
    }
    if (!isApproved) {
      return <Badge variant="outline" className="badge-warning">Submitted</Badge>;
    }

    const stage = brief.design_projects?.current_stage;
    switch (stage) {
      case 'brief_creation':
        return <Badge variant="outline" className="badge-primary">Approved</Badge>;
      case 'concept':
      case 'draft':
      case 'revision':
        return <Badge variant="outline" className="badge-primary">In Progress</Badge>;
      case 'final':
      case 'approved':
        return <Badge variant="outline" className="badge-success">Completed</Badge>;
      default:
        return <Badge variant="outline" className="badge-primary">Approved</Badge>;
    }
  };

  // Stats configuration
  const stats: StatItem[] = [
    {
      title: 'Total Briefs',
      value: filteredBriefs.length,
      description: 'All briefs',
      icon: FileText,
      iconColor: 'primary',
    },
    {
      title: 'Draft',
      value: filteredBriefs.filter((b: any) => !b.design_projects).length,
      description: 'Not submitted',
      icon: FileText,
    },
    {
      title: 'In Progress',
      value: filteredBriefs.filter((b: any) =>
        b.design_projects && ['concept', 'draft', 'revision'].includes(b.design_projects.current_stage)
      ).length,
      description: 'Being designed',
      icon: FileText,
      iconColor: 'info',
    },
    {
      title: 'Completed',
      value: filteredBriefs.filter((b: any) =>
        b.design_projects && ['final', 'approved'].includes(b.design_projects.current_stage)
      ).length,
      description: 'Finalized',
      icon: FileText,
      iconColor: 'success',
    },
  ];

  // DataTable columns configuration
  const columns: DataTableColumn<any>[] = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (value, row) => (
        <div>
          <Link href={`/design/briefs/${row.id}`} className="font-medium text-info hover:underline">
            {value as string}
          </Link>
          {row.description && (
            <p className="text-sm text-secondary line-clamp-1 mt-1">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => getStatusBadge(row),
    },
    {
      key: 'designer',
      label: 'Designer',
      render: (_, row) => row.design_projects?.designers?.name || "—",
    },
    {
      key: 'created_at',
      label: 'Created Date',
      sortable: true,
      render: (value) => {
        if (!value) return "—";
        return (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            {new Date(value as string).toLocaleDateString()}
          </div>
        );
      },
    },
    {
      key: 'target_market',
      label: 'Target Market',
      render: (value) => value as string || "—",
    },
  ];

  // Status options for TableFilters.Select
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'approved', label: 'Approved' },
    { value: 'concept', label: 'Concept' },
    { value: 'revision', label: 'Revision' },
    { value: 'final', label: 'Final' },
  ];

  // Row actions configuration
  const rowActions: DataTableRowAction<any>[] = [
    {
      label: 'View Details',
      icon: Pencil,
      onClick: (row) => router.push(`/design/briefs/${row.id}`),
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      separator: true,
      onClick: (row) => {
        setBriefToDelete(row);
        setDeleteDialogOpen(true);
      },
    },
  ];

  // Auth is handled by middleware - no need for client-side checks
  // Show loading state only during initial auth check
  if (authLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading..." size="lg" />
      </div>
    );
  }

  // Handle query error
  if (error) {
    return (
      <div className="page-container">
        <PageHeader
          title="Design Briefs"
          subtitle="Manage design briefs and requirements for new product development"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load design briefs"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.designBriefs.getAll.invalidate(),
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
        title="Design Briefs"
        subtitle="Manage design briefs and requirements for new product development"
        actions={[
          {
            label: 'Create Brief',
            icon: Plus,
            onClick: () => router.push('/design/briefs/new'),
          },
        ]}
      />

      {/* Summary Stats */}
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

        {/* Status Filter */}
        <TableFilters.Select
          value={rawFilters.status}
          onChange={(value) => setFilter('status', value)}
          options={statusOptions}
          placeholder="All Statuses"
        />
      </TableFilters.Bar>

      {/* Briefs DataTable - No filters prop (server-side only) */}
      {isLoading ? (
        <LoadingState message="Loading design briefs..." size="lg" />
      ) : filteredBriefs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No design briefs found"
          description="Create your first design brief to get started."
          action={{
            label: 'Create Brief',
            onClick: () => router.push('/design/briefs/new'),
            icon: Plus,
          }}
        />
      ) : (
        <DataTable
          data={filteredBriefs}
          columns={columns}
          rowActions={rowActions}
          onRowClick={(row) => router.push(`/design/briefs/${row.id}`)}
          pagination={{ pageSize: 20, showSizeSelector: true }}
          emptyState={{
            icon: FileText,
            title: 'No briefs match your filters',
            description: 'Try adjusting your search or filter criteria',
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Design Brief</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{briefToDelete?.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteBrief.isPending}
            >
              {deleteBrief.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
