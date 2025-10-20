"use client";

import React from "react";
import { api } from "@/lib/api/client";
import { useTableState } from "@/hooks/useTableFilters";
import { TableFilters } from "@/components/common";
import { Package, DollarSign, AlertCircle, TrendingUp, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProductionOrdersRealtime } from "@/hooks/useRealtimeSubscription";
import { Button } from "@/components/ui/button";
import {
  PageHeader,
  EmptyState,
  LoadingState,
  DataTable,
  StatsGrid,
  StatusBadge,
  type DataTableColumn,
  type StatItem,
} from "@/components/common";
import { DataErrorBoundary } from "@/components/error-handling";

function ProductionOrdersPageContent() {
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
    pageSize: 100,
  });

  // Backend query with unified params
  const { data, isLoading, error } = api.productionOrders.getAll.useQuery({
    ...queryParams,
    status: rawFilters.status === 'all' ? undefined : rawFilters.status,
  }, {
    enabled: true,
  });

  const orders = data?.items || [];

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Subscribe to realtime updates for production orders
  useProductionOrdersRealtime({
    queryKey: ['productionOrders', 'getAll'],
    enabled: true,
  });

  // Status options for filter
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'awaiting_deposit', label: 'Awaiting Deposit' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'awaiting_final_payment', label: 'Awaiting Final Payment' },
    { value: 'final_paid', label: 'Ready to Ship' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
  ];

  // Stats configuration
  const stats: StatItem[] = [
    {
      title: 'Total Orders',
      value: orders.length,
      description: 'All production orders',
      icon: Package,
      iconColor: 'info',
    },
    {
      title: 'Total Value',
      value: `$${orders.reduce((sum: number, order: any) => sum + Number(order.total_cost || 0), 0).toFixed(2)}`,
      description: 'Total order value',
      icon: DollarSign,
      iconColor: 'warning',
    },
    {
      title: 'In Production',
      value: orders.filter((order: any) => order.status === 'in_progress').length,
      description: 'Currently being produced',
      icon: TrendingUp,
      iconColor: 'info',
    },
    {
      title: 'Awaiting Payment',
      value: orders.filter((order: any) => order.status === 'awaiting_deposit' || order.status === 'awaiting_final_payment').length,
      description: 'Payment pending',
      icon: AlertCircle,
      iconColor: 'warning',
    },
  ];

  // DataTable columns configuration
  const columns: DataTableColumn<any>[] = [
    {
      key: 'order_number',
      label: 'Order Number',
      sortable: true,
      render: (value) => <span className="font-medium text-info">{value as string}</span>,
    },
    {
      key: 'item_name',
      label: 'Item',
      sortable: true,
    },
    {
      key: 'projects',
      label: 'Project',
      render: (value) => (value as any)?.name || <span className="text-muted">—</span>,
    },
    {
      key: 'quantity',
      label: 'Quantity',
      sortable: true,
    },
    {
      key: 'total_cost',
      label: 'Total Cost',
      sortable: true,
      render: (value) => <span className="font-medium">${Number(value || 0).toFixed(2)}</span>,
    },
    {
      key: 'deposit_paid',
      label: 'Payment',
      render: (_, row) => {
        if (!row.deposit_paid) {
          return <StatusBadge status="no deposit" />;
        }
        if (row.deposit_paid && !row.final_payment_paid) {
          return <StatusBadge status="deposit paid" />;
        }
        return <StatusBadge status="fully paid" />;
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value as string} />,
    },
    {
      key: 'order_date',
      label: 'Order Date',
      sortable: true,
      render: (value) => value ? new Date(value as string).toLocaleDateString() : <span className="text-muted">—</span>,
    },
  ];


  // Middleware handles authentication - no need for client-side auth checks
  // Page will be protected by middleware before reaching here

  // Handle query error
  if (error) {
    return (
      <div className="page-container">
        <PageHeader
          title="Production Orders"
          subtitle="View production orders with auto-generated invoices and payment tracking"
        />
        <EmptyState
          icon={AlertCircle}
          title="Failed to load production orders"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.productionOrders.getAll.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader
        title="Production Orders"
        subtitle={
          <>
            View production orders with auto-generated invoices and payment tracking. To create orders, go to{" "}
            <Link href="/crm/projects" className="text-info hover:underline font-medium">
              CRM → Projects
            </Link>
          </>
        }
        action={
          <Link href="/crm/projects">
            <Button className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </Link>
        }
      />

      {/* Stats Grid */}
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
          placeholder="Search by order number, item name, or project..."
        />

        {/* Status Filter */}
        <TableFilters.Select
          value={rawFilters.status}
          onChange={(value) => setFilter('status', value)}
          options={statusOptions}
          placeholder="All Statuses"
        />
      </TableFilters.Bar>

      {/* Orders DataTable */}
      {isLoading ? (
        <LoadingState message="Loading production orders..." size="lg" />
      ) : !orders || orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No production orders found"
          description={
            hasActiveFilters ? (
              "Try adjusting your filters to see more results."
            ) : (
              <>
                Create orders from{" "}
                <Link href="/crm/projects" className="text-info hover:underline">
                  Projects
                </Link>
              </>
            )
          }
        />
      ) : (
        <DataTable
          data={orders}
          columns={columns}
          onRowClick={(row) => router.push(`/production/orders/${row.id}`)}
          pagination={{ pageSize: 20, showSizeSelector: true }}
          emptyState={{
            icon: Package,
            title: 'No orders match your filters',
            description: 'Try adjusting your search or filter criteria',
          }}
        />
      )}
    </div>
  );
}

export default function ProductionOrdersPage() {
  return (
    <DataErrorBoundary context="production orders">
      <ProductionOrdersPageContent />
    </DataErrorBoundary>
  );
}
