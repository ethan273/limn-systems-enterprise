"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api/client";
import { useShipmentsRealtime } from "@/hooks/useRealtimeSubscription";
import { Badge } from "@/components/ui/badge";
import { ShippingStatusBadge } from "@/components/ui/status-badge";
import {
  TruckIcon,
  Package,
} from "lucide-react";
import { format } from "date-fns";
import {
  PageHeader,
  EmptyState,
  LoadingState,
  DataTable,
  StatsGrid,
  type DataTableColumn,
  type DataTableFilter,
  type StatItem,
} from "@/components/common";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

export default function ShipmentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [statusFilter, _setStatusFilter] = useState<string>("all");
  const [searchQuery, _setSearchQuery] = useState("");

  const { data, isLoading } = api.shipping.getAllShipments.useQuery(
    {
      status: statusFilter === "all" ? undefined : statusFilter,
      limit: 100,
      offset: 0,
    },
    {
      enabled: !!user,
    }
  );

  const shipments = data?.items || [];

  // Subscribe to realtime updates for shipments
  useShipmentsRealtime({
    queryKey: ['shipping', 'getAllShipments'],
    enabled: !!user,
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

  const filters: DataTableFilter[] = [
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "All Statuses", value: "all" },
        { label: "Pending", value: "pending" },
        { label: "Preparing", value: "preparing" },
        { label: "Ready", value: "ready" },
        { label: "Shipped", value: "shipped" },
        { label: "In Transit", value: "in_transit" },
        { label: "Delivered", value: "delivered" },
        { label: "Delayed", value: "delayed" },
      ],
    },
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
      key: "orders",
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
      key: "orders",
      label: "Customer",
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

  const filteredShipments = shipments.filter((shipment) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      shipment.shipment_number?.toLowerCase().includes(searchLower) ||
      shipment.tracking_number?.toLowerCase().includes(searchLower) ||
      shipment.orders?.order_number?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="page-container">
      <PageHeader
        title="All Shipments"
        description="Comprehensive shipment management with SEKO integration"
      />

      <StatsGrid stats={stats} />

      {isLoading ? (
        <LoadingState message="Loading shipments..." />
      ) : filteredShipments.length === 0 && !searchQuery ? (
        <EmptyState
          icon={TruckIcon}
          title="No Shipments Found"
          description="No shipments match your current filters."
        />
      ) : (
        <DataTable
          data={filteredShipments}
          columns={columns}
          filters={filters}
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
