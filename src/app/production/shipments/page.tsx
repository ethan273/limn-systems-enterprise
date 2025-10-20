"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
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
  Package,
  TruckIcon,
  CheckCircle2,
  Plus,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

export default function ProductionShipmentsPage() {
  const router = useRouter();
  const { user: _user } = useAuth();

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
    pageSize: 100,
  });

  // Backend query with unified params
  const { data, isLoading, error } = api.shipping.getAllShipments.useQuery({
    ...queryParams,
    status: rawFilters.status || undefined,
  }, {
    enabled: true,
  });

  const shipments = data?.items || [];

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Status options for filter
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'ready', label: 'Ready' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'delayed', label: 'Delayed' },
  ];

  // Statistics
  const stats: StatItem[] = [
    {
      title: 'Total Shipments',
      value: shipments.length,
      description: 'All production shipments',
      icon: TruckIcon,
      iconColor: 'info',
    },
    {
      title: 'Preparing',
      value: shipments.filter((s) => s.status === "preparing").length,
      description: 'Being prepared',
      icon: Package,
      iconColor: 'warning',
    },
    {
      title: 'Ready to Ship',
      value: shipments.filter((s) => s.status === "ready").length,
      description: 'Ready for dispatch',
      icon: CheckCircle2,
      iconColor: 'info',
    },
    {
      title: 'Shipped',
      value: shipments.filter((s) => s.status === "shipped").length,
      description: 'In transit',
      icon: TruckIcon,
      iconColor: 'success',
    },
  ];

  // DataTable columns
  const columns: DataTableColumn<any>[] = [
    {
      key: 'shipment_number',
      label: 'Shipment #',
      sortable: true,
      render: (value) => <span className="font-medium">{value as string || "—"}</span>,
    },
    {
      key: 'tracking_number',
      label: 'Tracking #',
      render: (value) => value ? (
        <span className="font-mono text-xs">{value as string}</span>
      ) : <span className="text-muted">Not assigned</span>,
    },
    {
      key: 'carrier',
      label: 'Carrier',
      render: (value) => value ? (
        <StatusBadge status={value as string} />
      ) : <span className="text-muted">—</span>,
    },
    {
      key: 'orders',
      label: 'Order',
      render: (value) => {
        const order = value as any;
        return order ? (
          <div>
            <div className="font-medium">{order.order_number}</div>
            {order.projects && (
              <div className="text-xs text-muted">{order.projects.project_name}</div>
            )}
          </div>
        ) : <span className="text-muted">—</span>;
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value as string} />,
    },
    {
      key: 'packages',
      label: 'Packages',
      render: (value) => {
        const packagesArray = Array.isArray(value) ? value : [];
        return (
          <div className="flex items-center gap-1">
            <Package className="icon-xs text-muted" aria-hidden="true" />
            <span>{packagesArray.length} packages</span>
          </div>
        );
      },
    },
    {
      key: 'shipped_date',
      label: 'Shipped Date',
      sortable: true,
      render: (value) => value ? (
        format(new Date(value as string), "MMM d, yyyy")
      ) : <span className="text-muted">—</span>,
    },
    {
      key: 'estimated_delivery',
      label: 'Est. Delivery',
      render: (value) => value ? (
        format(new Date(value as string), "MMM d, yyyy")
      ) : <span className="text-muted">—</span>,
    },
  ];


  // Handle query error
  if (error) {
    return (
      <div className="page-container">
        <PageHeader
          title="Production Shipments"
          subtitle="Prepare and track shipments from production orders"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load shipments"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.shipping.getAllShipments.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Production Shipments"
        subtitle="Prepare and track shipments from production orders"
        actions={[
          {
            label: 'View Full Shipping Module',
            icon: Plus,
            onClick: () => router.push("/shipping/shipments"),
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
          placeholder="Search by shipment #, tracking #..."
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
        <LoadingState message="Loading shipments..." size="lg" />
      ) : shipments.length === 0 ? (
        <EmptyState
          icon={TruckIcon}
          title="No Shipments Found"
          description={hasActiveFilters ? "Try adjusting your filters to see more results." : "No shipments match your current filters. Production shipments will appear here."}
        />
      ) : (
        <DataTable
          data={shipments}
          columns={columns}
          onRowClick={(row) => router.push(`/shipping/shipments/${row.id}`)}
          pagination={{ pageSize: 20, showSizeSelector: true }}
          emptyState={{
            icon: TruckIcon,
            title: 'No shipments match your filters',
            description: 'Try adjusting your search or filter criteria',
          }}
        />
      )}
    </div>
  );
}
