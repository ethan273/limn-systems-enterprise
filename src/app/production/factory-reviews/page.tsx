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
  Factory,
  Calendar,
  MapPin,
  Users,
  Image as ImageIcon,
  MessageSquare,
  FileText,
  Plus,
} from "lucide-react";
import { format } from "date-fns";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

export default function FactoryReviewsPage() {
  const router = useRouter();
  const [_statusFilter, _setStatusFilter] = useState<string>("all");
  const [_searchQuery, _setSearchQuery] = useState("");

  // Fetch factory review sessions
  const { data, isLoading } = api.factoryReviews.getAllSessions.useQuery({
    status: _statusFilter === "all" ? undefined : _statusFilter,
    limit: 50,
    offset: 0,
  });

  const sessions = data?.sessions || [];

  const filteredSessions = sessions.filter((session) => {
    if (!_searchQuery) return true;
    const searchLower = _searchQuery.toLowerCase();
    return (
      session.session_name.toLowerCase().includes(searchLower) ||
      session.prototype_production?.prototypes?.name.toLowerCase().includes(searchLower) ||
      session.location?.toLowerCase().includes(searchLower)
    );
  });

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

  // Filters
  const filters: DataTableFilter[] = [
    {
      key: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search sessions, prototypes, or locations...',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'scheduled', label: 'Scheduled' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
      ],
    },
  ];

  return (
    <div className="page-container">
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

      {isLoading ? (
        <LoadingState message="Loading sessions..." size="lg" />
      ) : filteredSessions.length === 0 ? (
        <EmptyState
          icon={Factory}
          title="No factory review sessions found"
          description={_searchQuery ? "Try adjusting your search" : "Get started by creating your first review session."}
          action={!_searchQuery ? {
            label: 'New Review Session',
            icon: Plus,
            onClick: () => router.push("/production/factory-reviews/new"),
          } : undefined}
        />
      ) : (
        <DataTable
          data={filteredSessions}
          columns={columns}
          filters={filters}
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
