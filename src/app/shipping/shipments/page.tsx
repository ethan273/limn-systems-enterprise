"use client";

import React from "react";
import { useRouter } from "next/navigation";
// Auth is handled by middleware - no client-side checks needed
import { api } from "@/lib/api/client";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { useTableState } from "@/hooks/useTableFilters";
import { useShipmentsRealtime } from "@/hooks/useRealtimeSubscription";
import { Badge } from "@/components/ui/badge";
import { ShippingStatusBadge } from "@/components/ui/status-badge";
import {
  TruckIcon,
  Package,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import {
  PageHeader,
  EmptyState,
  LoadingState,
  DataTable,
  StatsGrid,
  TableFilters,
  type DataTableColumn,
  type StatItem,
} from "@/components/common";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

export default function ShipmentsPage() {
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
      carrier: 'all',
    },
    debounceMs: 300,
    pageSize: 100,
  });

  const { data, isLoading, error } = api.shipping.getAllShipments.useQuery(
    {
      ...queryParams,
      status: rawFilters.status === 'all' ? undefined : rawFilters.status,
      carrier: rawFilters.carrier === 'all' ? undefined : rawFilters.carrier,
    },
    {
      enabled: true,
    }
  );

  const shipments = data?.items || [];

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Subscribe to realtime updates for shipments
  useShipmentsRealtime({
    queryKey: ['shipping', 'getAllShipments'],
    enabled: true,
  });

  const stats: StatItem[] = [
    {
      title: "Total Shipments",
      value: shipments.length,
      description: "All shipments",
      icon: TruckIcon,
      iconColor: 'info',
    },
    {
      title: "Pending",
      value: shipments.filter((s) => s.status === "pending").length,
      description: "Awaiting processing",
      icon: Package,
      iconColor: 'warning',
    },
    {
      title: "In Transit",
      value: shipments.filter((s) => s.status === "shipped" || s.status === "in_transit").length,
      description: "Currently shipping",
      icon: TruckIcon,
      iconColor: 'info',
    },
    {
      title: "Delivered",
      value: shipments.filter((s) => s.status === "delivered").length,
      description: "Successfully delivered",
      icon: Package,
      iconColor: 'success',
    },
  ];

  // Status options for filter
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'ready', label: 'Ready' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'in_transit', label: 'In Transit' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'delayed', label: 'Delayed' },
  ];

  // Carrier options for filter
  const carrierOptions = [
    { value: 'all', label: 'All Carriers' },
    { value: 'SEKO', label: 'SEKO' },
    { value: 'FedEx', label: 'FedEx' },
    { value: 'UPS', label: 'UPS' },
    { value: 'DHL', label: 'DHL' },
    { value: 'USPS', label: 'USPS' },
  ];

  const columns: DataTableColumn<typeof shipments[0]>[] = [
    {
      key: "shipment_number",
      label: "Shipment #",
      render: (value) => <span className="font-medium">{(value as string) || "—"}</span>,
    },
    {
      key: "tracking_number",
      label: "Tracking #",
      render: (value) =>
        value ? (
          <div className="font-mono text-xs">{value as string}</div>
        ) : (
          <span className="text-muted">Not assigned</span>
        ),
    },
    {
      key: "carrier",
      label: "Carrier",
      render: (value) =>
        value ? (
          <Badge variant="outline" className="badge-neutral">
            {value as string}
          </Badge>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: "order",
      label: "Order",
      render: (_, row) => {
        const orders = row.orders as any;
        return orders ? (
          <div className="text-sm">
            <div className="font-medium">{orders.order_number}</div>
            {orders.projects && (
              <div className="text-muted">{orders.projects.project_name}</div>
            )}
          </div>
        ) : (
          <span className="text-muted">—</span>
        );
      },
    },
    {
      key: "customer",
      label: "Client",
      render: (_, row) => {
        const orders = row.orders as any;
        return orders?.customers ? (
          <div className="text-sm">
            {orders.customers.company_name || orders.customers.name}
          </div>
        ) : (
          <span className="text-muted">—</span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (value) => <ShippingStatusBadge status={(value as string) || "pending"} />,
    },
    {
      key: "packages",
      label: "Packages",
      render: (value) => {
        const packagesArray = Array.isArray(value) ? value : [];
        return (
          <Badge variant="outline" className="badge-with-icon badge-neutral">
            <Package className="badge-icon" aria-hidden="true" />
            <span>{packagesArray.length}</span>
          </Badge>
        );
      },
    },
    {
      key: "shipped_date",
      label: "Shipped",
      render: (value) =>
        value ? (
          format(new Date(value as string), "MMM d, yyyy")
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: "estimated_delivery",
      label: "Est. Delivery",
      render: (value) =>
        value && typeof value === 'string' ? (
          format(new Date(value as string), "MMM d, yyyy")
        ) : (
          <span className="text-muted">—</span>
        ),
    },
  ];

  // Handle query error
  if (error) {
    return (
      <div className="page-container">
        <PageHeader
          title="All Shipments"
          description="Comprehensive shipment management with SEKO integration"
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
      <Breadcrumb />
      <PageHeader
        title="All Shipments"
        description="Comprehensive shipment management with SEKO integration"
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
          placeholder="Search shipments, tracking..."
        />

        {/* Status Filter */}
        <TableFilters.Select
          value={rawFilters.status}
          onChange={(value) => setFilter('status', value)}
          options={statusOptions}
          placeholder="All Statuses"
        />

        {/* Carrier Filter */}
        <TableFilters.Select
          value={rawFilters.carrier}
          onChange={(value) => setFilter('carrier', value)}
          options={carrierOptions}
          placeholder="All Carriers"
        />
      </TableFilters.Bar>

      {isLoading ? (
        <LoadingState message="Loading shipments..." />
      ) : shipments.length === 0 ? (
        <EmptyState
          icon={TruckIcon}
          title="No Shipments Found"
          description="No shipments match your current filters."
        />
      ) : (
        <DataTable
          data={shipments}
          columns={columns}
          onRowClick={(row) => router.push(`/shipping/shipments/${row.id}`)}
          emptyState={{
            icon: TruckIcon,
            title: "No Shipments Found",
            description: "No shipments match your search criteria.",
          }}
        />
      )}
    </div>
  );
}
