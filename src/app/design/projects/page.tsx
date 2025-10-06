"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { useAuthContext } from "@/lib/auth/AuthProvider";
import { Folder, Calendar, AlertCircle, Plus } from "lucide-react";
import {
  PageHeader,
  StatsGrid,
  LoadingState,
  EmptyState,
  DataTable,
  StatusBadge,
  PriorityBadge,
  type DataTableColumn,
  type DataTableFilter,
  type StatItem,
} from "@/components/common";
export const dynamic = 'force-dynamic';

export default function DesignProjectsPage() {
  const [stageFilter, _setStageFilter] = useState<string>("all");
  const [priorityFilter, _setPriorityFilter] = useState<string>("all");
  const [_searchQuery, _setSearchQuery] = useState("");
  const { user, loading: authLoading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const { data, isLoading } = api.designProjects.getAll.useQuery(
    {
      designStage: stageFilter === "all" ? undefined : stageFilter,
      search: undefined,
      limit: 50,
    },
    { enabled: !authLoading && !!user }
  );

  const filteredProjects = (data?.projects || []).filter((project: any) => {
    if (priorityFilter !== "all" && project.priority !== priorityFilter) {
      return false;
    }
    return true;
  });

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

  if (authLoading) {
    return <LoadingState message="Loading..." />;
  }

  if (!user) {
    return null;
  }

  const stats: StatItem[] = [
    {
      title: "Total Projects",
      value: filteredProjects.length,
      description: "All design projects",
      icon: Folder,
      iconColor: "info",
    },
    {
      title: "In Progress",
      value: filteredProjects.filter((p: any) =>
        ['concept', 'draft', 'revision'].includes(p.current_stage)
      ).length,
      description: "Active projects",
      icon: Folder,
      iconColor: "warning",
    },
    {
      title: "High Priority",
      value: filteredProjects.filter((p: any) =>
        p.priority === 'high' || p.priority === 'urgent'
      ).length,
      description: "Urgent projects",
      icon: AlertCircle,
      iconColor: "warning",
    },
    {
      title: "Approved",
      value: filteredProjects.filter((p: any) => p.current_stage === 'approved').length,
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

  // DataTable filters configuration
  const filters: DataTableFilter[] = [
    {
      key: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search by project name or code...',
    },
    {
      key: 'stage',
      label: 'Stage',
      type: 'select',
      options: [
        { value: 'all', label: 'All Stages' },
        { value: 'brief_creation', label: 'Brief Creation' },
        { value: 'concept', label: 'Concept' },
        { value: 'draft', label: 'Draft' },
        { value: 'revision', label: 'Revision' },
        { value: 'final', label: 'Final' },
        { value: 'approved', label: 'Approved' },
      ],
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { value: 'all', label: 'All Priorities' },
        { value: 'low', label: 'Low' },
        { value: 'normal', label: 'Normal' },
        { value: 'high', label: 'High' },
        { value: 'urgent', label: 'Urgent' },
      ],
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Design Projects"
        subtitle="Manage design projects from concept to final approval"
        actions={[
          {
            label: 'New Project',
            icon: Plus,
            onClick: () => {}, // TODO: Add navigation
          },
        ]}
      />

      <StatsGrid stats={stats} columns={4} />

      {/* Projects DataTable */}
      {isLoading ? (
        <LoadingState message="Loading design projects..." size="lg" />
      ) : !filteredProjects || filteredProjects.length === 0 ? (
        <EmptyState
          icon={Folder}
          title="No design projects found"
          description="Get started by creating your first project"
          action={{
            label: 'Create your first project',
            onClick: () => {},
            icon: Plus,
            variant: 'outline',
          }}
        />
      ) : (
        <DataTable
          data={filteredProjects}
          columns={columns}
          filters={filters}
          onRowClick={(row) => router.push(`/design/projects/${row.id}`)}
          pagination={{ pageSize: 20, showSizeSelector: true }}
          emptyState={{
            icon: Folder,
            title: 'No projects match your filters',
            description: 'Try adjusting your search or filter criteria',
          }}
        />
      )}
    </div>
  );
}
