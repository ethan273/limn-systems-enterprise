"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { useTableState } from "@/hooks/useTableFilters";
import {
  Truck,
  Package,
  Clock,
  CheckCircle2,
  Calendar,
  Box,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PageHeader,
  TableFilters,
  StatsGrid,
  EmptyState,
  LoadingState,
  type DataTableColumn,
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
  const utils = api.useUtils();

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
    pageSize: 50,
  });

  // Backend query with unified params
  const { data: shipmentsData, isLoading, error } = api.portal.getCustomerShipments.useQuery({
    ...queryParams,
  }, {
    enabled: true,
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

  // Transform status options to SelectOption format
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'picked_up', label: 'Picked Up' },
    { value: 'in_transit', label: 'In Transit' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'exception', label: 'Exception' },
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

  // Handle query error
  if (error) {
    return (
      <div className="page-container">
        <PageHeader
          title="Shipment Tracking"
          subtitle="Track your orders in real-time"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load shipments"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.portal.getCustomerShipments.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Shipment Tracking"
        subtitle="Track your orders in real-time"
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
          placeholder="Search tracking number or shipment number..."
        />

        {/* Status Filter */}
        <TableFilters.Select
          value={rawFilters.status}
          onChange={(value) => setFilter('status', value)}
          options={statusOptions}
          placeholder="All Statuses"
        />
      </TableFilters.Bar>

      {/* Results Count */}
      <div className="mb-4 text-sm text-muted-foreground">
        {shipmentsData?.total ? `${shipmentsData.total} shipment${shipmentsData.total === 1 ? '' : 's'} found` : 'No shipments found'}
      </div>

      {isLoading ? (
        <LoadingState message="Loading shipments..." size="lg" />
      ) : !shipments || shipments.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No shipments found"
          description={hasActiveFilters
            ? "Try adjusting your filters to see more results."
            : "You don't have any shipments yet."}
        />
      ) : (
        <div className="card">
          <table className="data-table" data-testid="data-table">
            <thead>
              <tr>
                <th>Shipment Number</th>
                <th>Tracking Number</th>
                <th>Carrier</th>
                <th>Status</th>
                <th>Shipped Date</th>
                <th>Est. Delivery</th>
                <th>Packages</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((shipment: any) => {
                const config = shipmentStatusConfig[shipment.status || 'pending'] || shipmentStatusConfig.pending;
                return (
                  <tr
                    key={shipment.id}
                    onClick={() => router.push(`/shipping/shipments/${shipment.id}`)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <td><span className="font-mono text-sm">{shipment.shipment_number || "—"}</span></td>
                    <td><span className="font-mono text-sm font-medium">{shipment.tracking_number || "—"}</span></td>
                    <td>
                      <div>
                        <p className="font-medium">{shipment.carrier || "—"}</p>
                        {shipment.service_level && (
                          <p className="text-xs text-muted-foreground">{shipment.service_level}</p>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge variant="outline" className={cn(config.className, "flex items-center gap-1 w-fit")}>
                        {config.icon}
                        {config.label}
                      </Badge>
                    </td>
                    <td>
                      {shipment.shipped_date ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                          {format(new Date(shipment.shipped_date), "MMM d, yyyy")}
                        </div>
                      ) : <span className="text-sm text-muted-foreground">—</span>}
                    </td>
                    <td>
                      {shipment.estimated_delivery ? (
                        <span className="text-sm">
                          {format(new Date(shipment.estimated_delivery), "MMM d, yyyy")}
                        </span>
                      ) : <span className="text-sm text-muted-foreground">—</span>}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Box className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                        <span className="text-sm">{shipment.package_count || 1}</span>
                        {shipment.weight && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({Number(shipment.weight).toFixed(2)} lbs)
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
