"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
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
  Package,
  TruckIcon,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { format } from "date-fns";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

export default function ProductionShipmentsPage() {
  const router = useRouter();
  const { user: _user } = useAuth();
  const [_statusFilter, _setStatusFilter] = useState<string>("all");
  const [_searchQuery, _setSearchQuery] = useState("");

  // Fetch shipments from production orders
  const { data, isLoading } = api.shipping.getAllShipments.useQuery(
    {
      status: _statusFilter === "all" ? undefined : _statusFilter,
      limit: 100,
      offset: 0,
    },
    {
      enabled: true,
    }
  );

  const shipments = data?.items || [];

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

  // Filters
  const filters: DataTableFilter[] = [
    {
      key: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search by shipment #, tracking #...',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'pending', label: 'Pending' },
        { value: 'preparing', label: 'Preparing' },
        { value: 'ready', label: 'Ready' },
        { value: 'shipped', label: 'Shipped' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'delayed', label: 'Delayed' },
      ],
    },
  ];

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

      {isLoading ? (
        <LoadingState message="Loading shipments..." size="lg" />
      ) : shipments.length === 0 ? (
        <EmptyState
          icon={TruckIcon}
          title="No Shipments Found"
          description="No shipments match your current filters. Production shipments will appear here."
        />
      ) : (
        <DataTable
          data={shipments}
          columns={columns}
          filters={filters}
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
