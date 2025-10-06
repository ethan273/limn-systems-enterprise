"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import {
  Truck,
  Package,
  Clock,
  CheckCircle2,
  Calendar,
  Box,
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PageHeader,
  DataTable,
  StatsGrid,
  EmptyState,
  LoadingState,
  type DataTableColumn,
  type DataTableFilter,
  type StatItem,
} from "@/components/common";

export const dynamic = 'force-dynamic';

const shipmentStatusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pending: {
    label: "Pending",
    className: "badge-neutral",
    icon: <Clock className="w-3 h-3" aria-hidden="true" />,
  },
  picked_up: {
    label: "Picked Up",
    className: "btn-primary text-info border-primary",
    icon: <Package className="w-3 h-3" aria-hidden="true" />,
  },
  in_transit: {
    label: "In Transit",
    className: "btn-primary text-info border-primary",
    icon: <Truck className="w-3 h-3" aria-hidden="true" />,
  },
  out_for_delivery: {
    label: "Out for Delivery",
    className: "btn-secondary text-secondary border-secondary",
    icon: <Truck className="w-3 h-3" aria-hidden="true" />,
  },
  delivered: {
    label: "Delivered",
    className: "bg-success-muted text-success border-success",
    icon: <CheckCircle2 className="w-3 h-3" aria-hidden="true" />,
  },
  exception: {
    label: "Exception",
    className: "bg-destructive-muted text-destructive border-destructive",
    icon: <Clock className="w-3 h-3" aria-hidden="true" />,
  },
};

export default function ShippingTrackingPage() {
  const router = useRouter();

  const { data: shipmentsData, isLoading } = api.portal.getCustomerShipments.useQuery({
    limit: 50,
    offset: 0,
  });

  const shipments = shipmentsData?.shipments || [];

  const stats: StatItem[] = [
    {
      title: 'Total Shipments',
      value: shipments.length,
      description: 'All shipments',
      icon: Package,
      iconColor: 'primary',
    },
    {
      title: 'In Transit',
      value: shipments.filter((s) => s.status === "in_transit").length,
      description: 'Currently shipping',
      icon: Truck,
      iconColor: 'info',
    },
    {
      title: 'Out for Delivery',
      value: shipments.filter((s) => s.status === "out_for_delivery").length,
      description: 'On final leg',
      icon: Truck,
    },
    {
      title: 'Delivered',
      value: shipments.filter((s) => s.status === "delivered").length,
      description: 'Completed',
      icon: CheckCircle2,
      iconColor: 'success',
    },
  ];

  const columns: DataTableColumn<any>[] = [
    {
      key: 'shipment_number',
      label: 'Shipment Number',
      sortable: true,
      render: (value) => <span className="font-mono text-sm">{value as string || "—"}</span>,
    },
    {
      key: 'tracking_number',
      label: 'Tracking Number',
      sortable: true,
      render: (value) => <span className="font-mono text-sm font-medium">{value as string || "—"}</span>,
    },
    {
      key: 'carrier',
      label: 'Carrier',
      render: (value, row) => (
        <div>
          <p className="font-medium">{value as string || "—"}</p>
          {row.service_level && (
            <p className="text-xs text-muted-foreground">{row.service_level}</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const config = shipmentStatusConfig[value as string || 'pending'] || shipmentStatusConfig.pending;
        return (
          <Badge variant="outline" className={cn(config.className, "flex items-center gap-1 w-fit")}>
            {config.icon}
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: 'shipped_date',
      label: 'Shipped Date',
      sortable: true,
      render: (value) => value ? (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
          {format(new Date(value as string), "MMM d, yyyy")}
        </div>
      ) : <span className="text-sm text-muted-foreground">—</span>,
    },
    {
      key: 'estimated_delivery',
      label: 'Est. Delivery',
      sortable: true,
      render: (value) => value ? (
        <span className="text-sm">
          {format(new Date(value as string), "MMM d, yyyy")}
        </span>
      ) : <span className="text-sm text-muted-foreground">—</span>,
    },
    {
      key: 'package_count',
      label: 'Packages',
      render: (value, row) => (
        <div className="flex items-center gap-1">
          <Box className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm">{value as number || 1}</span>
          {row.weight && (
            <span className="text-xs text-muted-foreground ml-2">
              ({Number(row.weight).toFixed(2)} lbs)
            </span>
          )}
        </div>
      ),
    },
  ];

  const filters: DataTableFilter[] = [
    {
      key: 'search',
      label: 'Search shipments',
      type: 'search',
      placeholder: 'Search tracking number or shipment number...',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'pending', label: 'Pending' },
        { value: 'picked_up', label: 'Picked Up' },
        { value: 'in_transit', label: 'In Transit' },
        { value: 'out_for_delivery', label: 'Out for Delivery' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'exception', label: 'Exception' },
      ],
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Shipment Tracking"
        subtitle="Track your orders in real-time"
      />

      <StatsGrid stats={stats} columns={4} />

      {isLoading ? (
        <LoadingState message="Loading shipments..." size="lg" />
      ) : !shipments || shipments.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No shipments found"
          description="You don't have any shipments yet."
        />
      ) : (
        <DataTable
          data={shipments}
          columns={columns}
          filters={filters}
          onRowClick={(row) => router.push(`/shipping/shipments/${row.id}`)}
          pagination={{ pageSize: 20, showSizeSelector: true }}
          emptyState={{
            icon: Truck,
            title: 'No shipments match your filters',
            description: 'Try adjusting your search or filter criteria',
          }}
        />
      )}
    </div>
  );
}
