"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import {
  PageHeader,
  StatsGrid,
  DataTable,
  EmptyState,
  LoadingState,
  StatusBadge,
  type StatItem,
  type DataTableColumn,
  type DataTableFilter,
} from "@/components/common";
import {
  Plus,
  Package,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lightbulb
} from "lucide-react";
import { format } from "date-fns";

// Status badge configuration
const statusConfig: Record<string, {
  label: string;
}> = {
  concept: { label: "Concept" },
  design_review: { label: "Design Review" },
  design_approved: { label: "Design Approved" },
  production_pending: { label: "Production Pending" },
  in_production: { label: "In Production" },
  assembly_complete: { label: "Assembly Complete" },
  quality_review: { label: "Quality Review" },
  client_review: { label: "Client Review" },
  approved: { label: "Approved" },
  rejected: { label: "Rejected" },
  ready_for_catalog: { label: "Ready for Catalog" },
  archived: { label: "Archived" }
};

export default function PrototypesPage() {
  const router = useRouter();
  const [statusFilter, _setStatusFilter] = useState<string>("all");
  const [priorityFilter, _setPriorityFilter] = useState<string>("all");
  const [typeFilter, _setTypeFilter] = useState<string>("all");
  const [designProjectFilter, _setDesignProjectFilter] = useState<string>("all");
  const [crmProjectFilter, _setCrmProjectFilter] = useState<string>("all");
  const [page, _setPage] = useState(0);
  const limit = 20;

  // Fetch prototypes with filters
  const { data, isLoading } = api.prototypes.getAll.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    priority: priorityFilter === "all" ? undefined : priorityFilter,
    prototypeType: typeFilter === "all" ? undefined : typeFilter,
    designProjectId: designProjectFilter === "all" ? undefined : designProjectFilter,
    crmProjectId: crmProjectFilter === "all" ? undefined : crmProjectFilter,
    limit,
    offset: page * limit,
  });

  // Fetch design projects for filter
  const { data: _designProjectsData } = api.designProjects.getAll.useQuery({
    limit: 100,
  });

  // Fetch CRM projects for filter
  const { data: _crmProjectsData } = api.projects.getAll.useQuery({
    limit: 100,
  });

  const prototypes = data?.prototypes ?? [];
  const _total = data?.total ?? 0;
  const _hasMore = data?.hasMore ?? false;

  // Calculate statistics
  const stats: StatItem[] = React.useMemo(() => {
    if (!data?.prototypes) return [
      { title: 'Total Prototypes', value: 0, icon: Package, iconColor: 'primary' },
      { title: 'In Progress', value: 0, icon: Clock, iconColor: 'info' },
      { title: 'Completed', value: 0, icon: CheckCircle2, iconColor: 'success' },
      { title: 'Rejected', value: 0, icon: AlertTriangle, iconColor: 'destructive' },
    ];

    const allPrototypes = data.prototypes;
    return [
      { title: 'Total Prototypes', value: allPrototypes.length, icon: Package, iconColor: 'primary' },
      {
        title: 'In Progress',
        value: allPrototypes.filter(p =>
          p.status === 'in_production' ||
          p.status === 'design_review' ||
          p.status === 'quality_review' ||
          p.status === 'client_review'
        ).length,
        icon: Clock,
        iconColor: 'info',
      },
      {
        title: 'Completed',
        value: allPrototypes.filter(p =>
          p.status === 'approved' ||
          p.status === 'ready_for_catalog'
        ).length,
        icon: CheckCircle2,
        iconColor: 'success',
      },
      {
        title: 'Rejected',
        value: allPrototypes.filter(p => p.status === 'rejected').length,
        icon: AlertTriangle,
        iconColor: 'destructive',
      },
    ];
  }, [data]);

  // DataTable columns
  const columns: DataTableColumn<any>[] = [
    {
      key: 'prototype_number',
      label: 'Prototype Number',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Lightbulb className="icon-sm text-muted" aria-hidden="true" />
          <span className="font-medium">{value as string}</span>
        </div>
      ),
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium">{value as string}</div>
          {row.description && (
            <div className="text-xs text-muted line-clamp-1">
              {row.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'prototype_type',
      label: 'Type',
      render: (value) => <span className="capitalize">{(value as string).replace('_', ' ')}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value as string} label={statusConfig[value as string]?.label} />,
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (value) => <StatusBadge status={value as string} />,
    },
    {
      key: 'production_progress',
      label: 'Production Progress',
      render: (_, row) => {
        if (row.prototype_production && Array.isArray(row.prototype_production) && row.prototype_production.length > 0 && row.prototype_production[0]) {
          const progress = row.prototype_production[0].overall_progress || 0;
          return (
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-info transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-muted">{progress}%</span>
            </div>
          );
        }
        return <span className="text-muted">—</span>;
      },
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value) => value ? (
        <time dateTime={new Date(value as string).toISOString()}>
          {format(new Date(value as string), "MMM d, yyyy")}
        </time>
      ) : <span className="text-muted">—</span>,
    },
  ];

  // Filters configuration
  const filters: DataTableFilter[] = [
    {
      key: 'search',
      label: 'Search prototypes',
      type: 'search',
      placeholder: 'Search by number or name...',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'concept', label: 'Concept' },
        { value: 'design_review', label: 'Design Review' },
        { value: 'design_approved', label: 'Design Approved' },
        { value: 'production_pending', label: 'Production Pending' },
        { value: 'in_production', label: 'In Production' },
        { value: 'assembly_complete', label: 'Assembly Complete' },
        { value: 'quality_review', label: 'Quality Review' },
        { value: 'client_review', label: 'Client Review' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'ready_for_catalog', label: 'Ready for Catalog' },
        { value: 'archived', label: 'Archived' },
      ],
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { value: 'all', label: 'All Priorities' },
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
      ],
    },
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'all', label: 'All Types' },
        { value: 'furniture', label: 'Furniture' },
        { value: 'accessory', label: 'Accessory' },
        { value: 'lighting', label: 'Lighting' },
        { value: 'textile', label: 'Textile' },
        { value: 'hardware', label: 'Hardware' },
      ],
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Prototypes"
        subtitle="Manage prototype development from concept to catalog"
        actions={[
          {
            label: 'Create Prototype',
            icon: Plus,
            onClick: () => router.push("/prototypes/new"),
          },
        ]}
      />

      <StatsGrid stats={stats} columns={4} />

      {isLoading ? (
        <LoadingState message="Loading prototypes..." size="lg" />
      ) : prototypes.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No Prototypes Found"
          description="Get started by creating your first prototype."
          action={{
            label: 'Create First Prototype',
            icon: Plus,
            onClick: () => router.push("/prototypes/new"),
          }}
        />
      ) : (
        <DataTable
          data={prototypes}
          columns={columns}
          filters={filters}
          onRowClick={(row) => router.push(`/prototypes/${row.id}`)}
          pagination={{ pageSize: limit, showSizeSelector: true }}
          emptyState={{
            icon: Lightbulb,
            title: 'No prototypes match your filters',
            description: 'Try adjusting your search or filter criteria',
          }}
        />
      )}
    </div>
  );
}
