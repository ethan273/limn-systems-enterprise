"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { useTableState } from "@/hooks/useTableFilters";
import { Folder, Calendar, AlertCircle, Plus, Pencil, Trash2, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  PageHeader,
  StatsGrid,
  LoadingState,
  EmptyState,
  DataTable,
  StatusBadge,
  PriorityBadge,
  TableFilters,
  Breadcrumb,
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

export const dynamic = 'force-dynamic';

export default function DesignProjectsPage() {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<any>(null);

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
      designStage: '',
      priority: 'all',
    },
    debounceMs: 300,
    pageSize: 50,
  });

  // Backend query with unified params
  const { data, isLoading, error } = api.designProjects.getAll.useQuery(
    {
      ...queryParams,
      status: rawFilters.designStage === 'all' ? undefined : rawFilters.designStage,
    },
    { enabled: true } // Middleware ensures auth, so no need to wait for client auth
  );

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  const deleteProject = api.designProjects.delete.useMutation({
    onSuccess: () => {
      toast.success("Design project deleted successfully");
      // Invalidate queries for instant updates
      utils.designProjects.getAll.invalidate();
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    },
    onError: (error) => {
      toast.error("Failed to delete design project: " + error.message);
    },
  });

  const handleConfirmDelete = () => {
    if (projectToDelete) {
      deleteProject.mutate({ id: projectToDelete.id });
    }
  };

  const projects = data?.projects || [];

  const getStageBadge = (stage: string) => {
    const stageMap: Record<string, { label: string; status: string }> = {
      brief_creation: { label: 'Brief Creation', status: 'pending' },
      concept: { label: 'Concept', status: 'in_progress' },
      draft: { label: 'Draft', status: 'in_progress' },
      revision: { label: 'Revision', status: 'in_progress' },
      final: { label: 'Final', status: 'completed' },
      approved: { label: 'Approved', status: 'approved' },
    };
    const config = Object.prototype.hasOwnProperty.call(stageMap, stage)
      // eslint-disable-next-line security/detect-object-injection
      ? stageMap[stage]
      : { label: stage, status: 'pending' };
    return <StatusBadge status={config.label} />;
  };

  const getPriorityBadge = (priority: string) => {
    return <PriorityBadge priority={priority} />;
  };

  const stats: StatItem[] = [
    {
      title: "Total Projects",
      value: projects.length,
      description: "All design projects",
      icon: Folder,
      iconColor: "info",
    },
    {
      title: "In Progress",
      value: projects.filter((p: any) =>
        ['concept', 'draft', 'revision'].includes(p.current_stage)
      ).length,
      description: "Active projects",
      icon: Folder,
      iconColor: "warning",
    },
    {
      title: "High Priority",
      value: projects.filter((p: any) =>
        p.priority === 'high' || p.priority === 'urgent'
      ).length,
      description: "Urgent projects",
      icon: AlertCircle,
      iconColor: "warning",
    },
    {
      title: "Approved",
      value: projects.filter((p: any) => p.current_stage === 'approved').length,
      description: "Completed projects",
      icon: Folder,
      iconColor: "success",
    },
  ];

  // DataTable columns configuration
  const columns: DataTableColumn<any>[] = [
    {
      key: 'project_code',
      label: 'Project Code',
      sortable: true,
      render: (value) => <span className="font-medium">{(value as string) || "—"}</span>,
    },
    {
      key: 'project_name',
      label: 'Name',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium">{value as string}</div>
          {row.project_type && (
            <div className="text-sm text-muted">{row.project_type}</div>
          )}
        </div>
      ),
    },
    {
      key: 'designers',
      label: 'Designer',
      render: (value) => (value as any)?.name || "—",
    },
    {
      key: 'current_stage',
      label: 'Stage',
      render: (value) => getStageBadge(value as string),
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (value) => getPriorityBadge(value as string),
    },
    {
      key: 'target_launch_date',
      label: 'Target Launch',
      sortable: true,
      render: (value) => {
        if (!value) return "—";
        return (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="icon-xs text-muted" aria-hidden="true" />
            {new Date(value as string).toLocaleDateString()}
          </div>
        );
      },
    },
  ];

  // Filter options for TableFilters components
  const stageOptions = [
    { value: 'all', label: 'All Stages' },
    { value: 'brief_creation', label: 'Brief Creation' },
    { value: 'concept', label: 'Concept' },
    { value: 'draft', label: 'Draft' },
    { value: 'revision', label: 'Revision' },
    { value: 'final', label: 'Final' },
    { value: 'approved', label: 'Approved' },
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  // Row actions configuration
  const rowActions: DataTableRowAction<any>[] = [
    {
      label: 'View Details',
      icon: Pencil,
      onClick: (row) => router.push(`/design/projects/${row.id}`),
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      separator: true,
      onClick: (row) => {
        setProjectToDelete(row);
        setDeleteDialogOpen(true);
      },
    },
  ];

  // Handle auth loading
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
          title="Design Projects"
          subtitle="Manage design projects from concept to final approval"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load design projects"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.designProjects.getAll.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <Breadcrumb />

      <PageHeader
        title="Design Projects"
        subtitle="Manage design projects from concept to final approval"
        actions={[
          {
            label: 'New Project',
            icon: Plus,
            onClick: () => router.push('/design/projects/new'),
          },
        ]}
      />

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
          placeholder="Search by project name or code..."
        />

        {/* Stage Filter */}
        <TableFilters.Select
          value={rawFilters.designStage}
          onChange={(value) => setFilter('designStage', value)}
          options={stageOptions}
          placeholder="All Stages"
        />

        {/* Priority Filter */}
        <TableFilters.Select
          value={rawFilters.priority}
          onChange={(value) => setFilter('priority', value)}
          options={priorityOptions}
          placeholder="All Priorities"
        />
      </TableFilters.Bar>

      {/* Projects DataTable - No filters prop (server-side only) */}
      {isLoading ? (
        <LoadingState message="Loading design projects..." size="lg" />
      ) : !projects || projects.length === 0 ? (
        <EmptyState
          icon={Folder}
          title="No design projects found"
          description="Get started by creating your first project"
          action={{
            label: 'Create your first project',
            onClick: () => router.push('/design/projects/new'),
            icon: Plus,
            variant: 'outline',
          }}
        />
      ) : (
        <DataTable
          data={projects}
          columns={columns}
          rowActions={rowActions}
          onRowClick={(row) => router.push(`/design/projects/${row.id}`)}
          pagination={{ pageSize: 20, showSizeSelector: true }}
          emptyState={{
            icon: Folder,
            title: 'No projects match your filters',
            description: 'Try adjusting your search or filter criteria',
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Design Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{projectToDelete?.project_name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteProject.isPending}
            >
              {deleteProject.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
