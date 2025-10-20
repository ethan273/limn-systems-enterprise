"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { useTableState } from "@/hooks/useTableFilters";
import {
  PageHeader,
  StatsGrid,
  DataTable,
  EmptyState,
  LoadingState,
  StatusBadge,
  TableFilters,
  type StatItem,
  type DataTableColumn,
} from "@/components/common";
import {
  Package,
  Clock,
  PackageCheck,
  Truck,
  Box,
  Weight,
  Plus,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

export default function PackingJobsPage() {
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
      status: '',
    },
    debounceMs: 300,
    pageSize: 50,
  });

  const utils = api.useUtils();

  // Fetch packing jobs - backend filtering only
  const { data, isLoading, error } = api.packing.getAllJobs.useQuery(queryParams);

  const jobs = data?.jobs || [];

  // Statistics
  const stats: StatItem[] = [
    {
      title: 'Total Jobs',
      value: jobs.length,
      description: 'All packing jobs',
      icon: Package,
      iconColor: 'info',
    },
    {
      title: 'Pending',
      value: jobs.filter((j) => j.packing_status === "pending").length,
      description: 'Awaiting packing',
      icon: Clock,
      iconColor: 'warning',
    },
    {
      title: 'In Progress',
      value: jobs.filter((j) => j.packing_status === "in_progress").length,
      description: 'Currently packing',
      icon: Package,
      iconColor: 'info',
    },
    {
      title: 'Packed',
      value: jobs.filter((j) => j.packing_status === "packed").length,
      description: 'Ready to ship',
      icon: PackageCheck,
      iconColor: 'success',
    },
    {
      title: 'Shipped',
      value: jobs.filter((j) => j.packing_status === "shipped").length,
      description: 'In transit',
      icon: Truck,
      iconColor: 'primary',
    },
  ];

  // DataTable columns
  const columns: DataTableColumn<any>[] = [
    {
      key: 'order_items',
      label: 'Item Description',
      render: (value, row) => (
        <div>
          <p className="font-medium">{(value as any)?.description || "—"}</p>
          {row.special_instructions && (
            <p className="text-xs text-muted flex items-center gap-1 mt-1">
              <AlertCircle className="icon-xs" aria-hidden="true" />
              {row.special_instructions}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'quantity',
      label: 'Quantity',
      render: (value, row) => {
        const packingProgress = row.quantity > 0
          ? Math.round((row.packed_quantity / row.quantity) * 100)
          : 0;
        return (
          <div>
            <p className="font-medium">{row.packed_quantity} / {value}</p>
            <p className="text-xs text-muted">{packingProgress}% packed</p>
          </div>
        );
      },
    },
    {
      key: 'packing_status',
      label: 'Status',
      render: (value) => <StatusBadge status={value as string} />,
    },
    {
      key: '_count',
      label: 'Boxes',
      render: (value) => (
        <div className="flex items-center gap-1">
          <Box className="icon-sm text-muted" aria-hidden="true" />
          {(value as any)?.packing_boxes || 0}
        </div>
      ),
    },
    {
      key: 'total_weight',
      label: 'Weight',
      render: (value) => value ? (
        <div className="flex items-center gap-1">
          <Weight className="icon-sm text-muted" aria-hidden="true" />
          {Number(value).toFixed(2)} lbs
        </div>
      ) : <span className="text-muted">—</span>,
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (value) => <StatusBadge status={value as string} />,
    },
    {
      key: 'tracking_number',
      label: 'Tracking',
      render: (value) => value ? (
        <span className="font-mono text-sm">{value as string}</span>
      ) : <span className="text-muted">—</span>,
    },
  ];

  // Filter options
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'packed', label: 'Packed' },
    { value: 'shipped', label: 'Shipped' },
  ];

  // Handle query error
  if (error) {
    return (
      <div className="page-container">
        <PageHeader
          title="Packing Jobs"
          subtitle="Manage packing and prepare items for shipment"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load packing jobs"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.packing.getAllJobs.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Packing Jobs"
        subtitle="Manage packing and prepare items for shipment"
        actions={[
          {
            label: 'New Packing Job',
            icon: Plus,
            onClick: () => router.push("/production/packing/new"),
          },
        ]}
      />

      <StatsGrid stats={stats} columns={4} />

      {/* Filters - New Unified System */}
      <TableFilters.Bar
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      >
        {/* Status Filter */}
        <TableFilters.Select
          value={rawFilters.status}
          onChange={(value) => setFilter('status', value)}
          options={statusOptions}
          placeholder="All Statuses"
        />
      </TableFilters.Bar>

      {/* Packing Jobs DataTable - No filters prop (server-side only) */}
      {isLoading ? (
        <LoadingState message="Loading packing jobs..." size="lg" />
      ) : jobs.length === 0 && !hasActiveFilters ? (
        <EmptyState
          icon={Package}
          title="No packing jobs found"
          description="Get started by creating your first packing job."
          action={{
            label: 'New Packing Job',
            icon: Plus,
            onClick: () => router.push("/production/packing/new"),
          }}
        />
      ) : (
        <DataTable
          data={jobs}
          columns={columns}
          onRowClick={(row) => router.push(`/production/packing/${row.id}`)}
          pagination={{ pageSize: 20, showSizeSelector: true }}
          emptyState={{
            icon: Package,
            title: 'No packing jobs match your filters',
            description: 'Try adjusting your search or filter criteria',
          }}
        />
      )}
    </div>
  );
}
