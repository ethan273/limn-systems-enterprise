"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { useAuthContext } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  PageHeader,
  DataTable,
  StatsGrid,
  EmptyState,
  LoadingState,
  type DataTableColumn,
  type DataTableFilter,
  type DataTableRowAction,
  type StatItem,
} from "@/components/common";
import { Plus, FileText, Calendar, Pencil, Trash2 } from "lucide-react";
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
  const { user, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [briefToDelete, setBriefToDelete] = useState<any>(null);

  // Auth is handled by middleware - no client-side redirect needed

  const { data, isLoading, refetch } = api.designBriefs.getAll.useQuery(
    {
      limit: 50,
    },
    { enabled: !authLoading && !!user }
  );

  const deleteBrief = api.designBriefs.delete.useMutation({
    onSuccess: () => {
      toast.success("Design brief deleted successfully");
      refetch();
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

  // DataTable filters configuration
  const filters: DataTableFilter[] = [
    {
      key: 'search',
      label: 'Search briefs',
      type: 'search',
      placeholder: 'Search by title or description...',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'draft', label: 'Draft' },
        { value: 'submitted', label: 'Submitted' },
        { value: 'approved', label: 'Approved' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
      ],
    },
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

  if (authLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading..." size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
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

      {/* Briefs DataTable */}
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
          filters={filters}
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
              Are you sure you want to delete "{briefToDelete?.title}"? This action cannot be undone.
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
