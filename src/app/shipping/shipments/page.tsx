"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api/client";
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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  const stats: StatItem[] = [
    {
      label: "Total Shipments",
      value: shipments.length,
      variant: "default",
    },
    {
      label: "Pending",
      value: shipments.filter((s) => s.status === "pending").length,
      variant: "warning",
    },
    {
      label: "In Transit",
      value: shipments.filter((s) => s.status === "shipped" || s.status === "in_transit").length,
      variant: "info",
    },
    {
      label: "Delivered",
      value: shipments.filter((s) => s.status === "delivered").length,
      variant: "success",
    },
  ];

  const filters: DataTableFilter[] = [
    {
      key: "status",
      label: "Status",
      type: "select",
      value: statusFilter,
      onChange: setStatusFilter,
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
      render: (value) => <span className="font-medium">{value || "—"}</span>,
    },
    {
      key: "tracking_number",
      label: "Tracking #",
      render: (value) =>
        value ? (
          <div className="font-mono text-xs">{value}</div>
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
            {value}
          </Badge>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: "orders",
      label: "Order",
      render: (_, row) =>
        row.orders ? (
          <div className="text-sm">
            <div className="font-medium">{row.orders.order_number}</div>
            {row.orders.projects && (
              <div className="text-muted">{row.orders.projects.project_name}</div>
            )}
          </div>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: "orders",
      label: "Customer",
      render: (_, row) =>
        row.orders?.customers ? (
          <div className="text-sm">
            {row.orders.customers.company_name || row.orders.customers.name}
          </div>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: "status",
      label: "Status",
      render: (value) => <ShippingStatusBadge status={value || "pending"} />,
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
          format(new Date(value), "MMM d, yyyy")
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: "estimated_delivery",
      label: "Est. Delivery",
      render: (value) =>
        value ? (
          format(new Date(value), "MMM d, yyyy")
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
          searchPlaceholder="Search by shipment #, tracking #, order #..."
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
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
