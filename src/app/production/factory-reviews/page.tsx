"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { api } from "@/lib/api/client";
import { useTableState } from "@/hooks/useTableFilters";
import { TableFilters } from "@/components/common";
import {
  PageHeader,
  StatsGrid,
  DataTable,
  EmptyState,
  LoadingState,
  StatusBadge,
  type StatItem,
  type DataTableColumn,
} from "@/components/common";
import {
  Factory,
  Calendar,
  MapPin,
  Users,
  Image as ImageIcon,
  MessageSquare,
  FileText,
  Plus,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

export default function FactoryReviewsPage() {
  const router = useRouter();

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
      status: 'all',
    },
    debounceMs: 300,
    pageSize: 50,
  });

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Backend query with unified params
  const { data, isLoading, error } = api.factoryReviews.getAllSessions.useQuery({
    ...queryParams,
    status: rawFilters.status === 'all' ? undefined : rawFilters.status,
  }, {
    enabled: true,
  });

  const sessions = data?.sessions || [];

  // Status options for filter
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  // Statistics
  const stats: StatItem[] = [
    {
      title: 'Total Sessions',
      value: sessions.length,
      description: 'All review sessions',
      icon: Factory,
      iconColor: 'info',
    },
    {
      title: 'Scheduled',
      value: sessions.filter((s) => s.status === "scheduled").length,
      description: 'Upcoming reviews',
      icon: Calendar,
      iconColor: 'warning',
    },
    {
      title: 'In Progress',
      value: sessions.filter((s) => s.status === "in_progress").length,
      description: 'Currently reviewing',
      icon: Users,
      iconColor: 'info',
    },
    {
      title: 'Completed',
      value: sessions.filter((s) => s.status === "completed").length,
      description: 'Finished reviews',
      icon: FileText,
      iconColor: 'success',
    },
  ];

  // DataTable columns
  const columns: DataTableColumn<any>[] = [
    {
      key: 'session_name',
      label: 'Session',
      render: (value, row) => (
        <div>
          <p className="font-medium">{value as string}</p>
          <p className="text-sm text-muted">Review #{row.session_number}</p>
        </div>
      ),
    },
    {
      key: 'prototype_production',
      label: 'Prototype',
      render: (value) => {
        const proto = value as any;
        return proto?.prototypes ? (
          <div>
            <p className="font-medium">{proto.prototypes.name}</p>
            <p className="text-sm text-muted">{proto.prototypes.prototype_number}</p>
          </div>
        ) : <span className="text-muted">—</span>;
      },
    },
    {
      key: 'review_date',
      label: 'Date',
      sortable: true,
      render: (value) => format(new Date(value as string), "MMM d, yyyy"),
    },
    {
      key: 'location',
      label: 'Location',
      render: (value) => value ? (
        <div className="flex items-center gap-1">
          <MapPin className="icon-xs text-muted" aria-hidden="true" />
          {value as string}
        </div>
      ) : <span className="text-muted">—</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value as string} />,
    },
    {
      key: '_count',
      label: 'Photos',
      render: (value) => (
        <div className="flex items-center gap-1">
          <ImageIcon className="icon-sm text-muted" aria-hidden="true" />
          {(value as any)?.factory_review_photos || 0}
        </div>
      ),
    },
    {
      key: '_count',
      label: 'Comments',
      render: (value) => (
        <div className="flex items-center gap-1">
          <MessageSquare className="icon-sm text-muted" aria-hidden="true" />
          {(value as any)?.factory_review_comments || 0}
        </div>
      ),
    },
  ];


  // Handle query error
  if (error) {
    return (
      <div className="page-container">
        <PageHeader
          title="Factory Reviews"
          subtitle="On-site prototype inspection sessions"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load factory review sessions"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.factoryReviews.getAllSessions.invalidate(),
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
        title="Factory Reviews"
        subtitle="On-site prototype inspection sessions"
        actions={[
          {
            label: 'New Review Session',
            icon: Plus,
            onClick: () => router.push("/production/factory-reviews/new"),
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
          placeholder="Search sessions, prototypes, or locations..."
        />

        {/* Status Filter */}
        <TableFilters.Select
          value={rawFilters.status}
          onChange={(value) => setFilter('status', value)}
          options={statusOptions}
          placeholder="All Statuses"
        />
      </TableFilters.Bar>

      {isLoading ? (
        <LoadingState message="Loading sessions..." size="lg" />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={Factory}
          title="No factory review sessions found"
          description={hasActiveFilters ? "Try adjusting your filters to see more results." : "Get started by creating your first review session."}
          action={!hasActiveFilters ? {
            label: 'New Review Session',
            icon: Plus,
            onClick: () => router.push("/production/factory-reviews/new"),
          } : undefined}
        />
      ) : (
        <DataTable
          data={sessions}
          columns={columns}
          onRowClick={(row) => router.push(`/production/factory-reviews/${row.id}`)}
          pagination={{ pageSize: 20, showSizeSelector: true }}
          emptyState={{
            icon: Factory,
            title: 'No sessions match your filters',
            description: 'Try adjusting your search or filter criteria',
          }}
        />
      )}
    </div>
  );
}
