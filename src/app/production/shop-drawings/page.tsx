"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { api } from "@/lib/api/client";
import { useTableState } from "@/hooks/useTableFilters";
import { TableFilters } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Building2,
  Package,
  Plus,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  PageHeader,
  EmptyState,
  LoadingState,
  DataTable,
  StatsGrid,
  type DataTableColumn,
  type StatItem,
} from "@/components/common";

// Status badge configuration
const statusConfig: Record<string, {
  label: string;
  className: string;
}> = {
  in_review: {
    label: "In Review",
    className: "bg-warning-muted text-warning border-warning"
  },
  designer_approved: {
    label: "Designer Approved",
    className: "bg-info-muted text-info border-info"
  },
  approved: {
    label: "Approved",
    className: "bg-success-muted text-success border-success"
  },
  rejected: {
    label: "Rejected",
    className: "bg-destructive-muted text-destructive border-destructive"
  },
  revision_requested: {
    label: "Revision Requested",
    className: "bg-orange-100 text-warning border-orange-300"
  }
};

export default function ShopDrawingsPage() {
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
    pageSize: 20,
  });

  const utils = api.useUtils();

  // Backend query with unified params
  const { data, isLoading, error } = api.shopDrawings.getAll.useQuery({
    ...queryParams,
    status: rawFilters.status === 'all' ? undefined : rawFilters.status,
  }, {
    enabled: true,
  });

  const drawings = data?.drawings ?? [];
  const total = data?.total ?? 0;

  // Status options for filter
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'in_review', label: 'In Review' },
    { value: 'designer_approved', label: 'Designer Approved' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'revision_requested', label: 'Revision Requested' },
  ];

  const stats: StatItem[] = [
    {
      title: "Total Drawings",
      value: drawings.length,
      description: "All shop drawings",
      icon: FileText,
      iconColor: 'primary',
    },
    {
      title: "Pending Review",
      value: drawings.filter(d => d.status === 'in_review' || d.status === 'designer_approved').length,
      description: "Awaiting approval",
      icon: FileText,
      iconColor: 'warning',
    },
    {
      title: "Approved",
      value: drawings.filter(d => d.status === 'approved').length,
      description: "Ready for production",
      icon: FileText,
      iconColor: 'success',
    },
    {
      title: "Rejected",
      value: drawings.filter(d => d.status === 'rejected' || d.status === 'revision_requested').length,
      description: "Needs revision",
      icon: FileText,
      iconColor: 'destructive',
    },
  ];


  const columns: DataTableColumn<typeof drawings[0]>[] = [
    {
      key: "drawing_number",
      label: "Drawing Number",
      render: (value) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          {value as string}
        </div>
      ),
    },
    {
      key: "drawing_name",
      label: "Name",
    },
    {
      key: "production_orders",
      label: "Production Order",
      render: (value) => {
        const order = value as any;
        return order ? (
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <div>
              <div className="font-medium">{order.order_number}</div>
              <div className="text-xs text-muted-foreground">
                {order.item_name}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      key: "partners",
      label: "Factory",
      render: (value) => {
        const partner = value as any;
        return partner ? (
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            {partner.company_name}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      key: "current_version",
      label: "Version",
      render: (value) => (
        <span className="font-mono text-sm">
          v{value as string}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value) => {
        const status = value as string;
        // eslint-disable-next-line security/detect-object-injection
        const config = statusConfig[status] || statusConfig.in_review;
        return (
          <Badge variant="outline" className={cn("text-xs", config.className)}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: "created_at",
      label: "Created",
      render: (value) =>
        value ? (
          <time dateTime={new Date(value as string).toISOString()}>
            {format(new Date(value as string), "MMM d, yyyy")}
          </time>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ];

  // Handle query error
  if (error) {
    return (
      <div className="page-container">
        <Breadcrumb />
        <PageHeader
          title="Shop Drawings"
          description="Manage production drawings with version control and approvals"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load shop drawings"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.shopDrawings.getAll.invalidate(),
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
        title="Shop Drawings"
        description="Manage production drawings with version control and approvals"
        actions={[
          {
            label: "Upload Drawing",
            icon: Plus,
            onClick: () => router.push("/production/shop-drawings/new"),
          },
        ]}
      />

      <StatsGrid stats={stats} />

      {/* Filters - New Unified System */}
      <TableFilters.Bar
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      >
        {/* Search Filter */}
        <TableFilters.Search
          value={rawFilters.search}
          onChange={(value) => setFilter('search', value)}
          placeholder="Search shop drawings..."
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
        <LoadingState message="Loading shop drawings..." />
      ) : drawings.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Shop Drawings Found"
          description={hasActiveFilters ? "Try adjusting your filters to see more results." : "Get started by uploading your first shop drawing."}
          action={!hasActiveFilters ? {
            label: "Upload First Drawing",
            icon: Plus,
            onClick: () => router.push("/production/shop-drawings/new"),
          } : undefined}
        />
      ) : (
        <DataTable
          data={drawings as any[]}
          columns={columns}
          onRowClick={(row) => router.push(`/production/shop-drawings/${row.id}`)}
          emptyState={{
            icon: FileText,
            title: "No Shop Drawings Found",
            description: "Try adjusting your filters to see more results.",
          }}
          pagination={
            total > 20
              ? {
                  pageSize: 20,
                  showSizeSelector: false,
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
