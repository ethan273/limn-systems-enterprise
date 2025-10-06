"use client";

import { useEffect } from "react";
import { api } from "@/lib/api/client";
import { Package, DollarSign, AlertCircle, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  PageHeader,
  EmptyState,
  LoadingState,
  DataTable,
  StatsGrid,
  StatusBadge,
  type DataTableColumn,
  type DataTableFilter,
  type StatItem,
} from "@/components/common";

export default function ProductionOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  // Query PRODUCTION ORDERS (Phase 1 system with invoices/payments)
  const { data, isLoading } = api.productionOrders.getAll.useQuery(
    {},
    { enabled: !authLoading && !!user }
  );

  const orders = data?.items || [];


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
          return <StatusBadge status="no_deposit" label="No Deposit" />;
        }
        if (row.deposit_paid && !row.final_payment_paid) {
          return <StatusBadge status="deposit_paid" label="Deposit Paid" />;
        }
        return <StatusBadge status="fully_paid" label="Fully Paid" />;
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const statusLabels: Record<string, string> = {
          'awaiting_deposit': 'Awaiting Deposit',
          'in_progress': 'In Progress',
          'completed': 'Completed',
          'awaiting_final_payment': 'Awaiting Final Payment',
          'final_paid': 'Ready to Ship',
          'shipped': 'Shipped',
          'delivered': 'Delivered',
        };
        return <StatusBadge status={value as string} label={statusLabels[value as string]} />;
      },
    },
    {
      key: 'order_date',
      label: 'Order Date',
      sortable: true,
      render: (value) => value ? new Date(value as string).toLocaleDateString() : <span className="text-muted">—</span>,
    },
  ];

  // DataTable filters configuration
  const filters: DataTableFilter[] = [
    {
      key: 'search',
      label: 'Search orders',
      type: 'search',
      placeholder: 'Search by order number, item name, or project...',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'awaiting_deposit', label: 'Awaiting Deposit' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
        { value: 'awaiting_final_payment', label: 'Awaiting Final Payment' },
        { value: 'final_paid', label: 'Ready to Ship' },
        { value: 'shipped', label: 'Shipped' },
        { value: 'delivered', label: 'Delivered' },
      ],
    },
  ];

  // Show loading state while checking authentication
  if (authLoading) {
    return <LoadingState message="Checking authentication..." size="lg" />;
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
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
      />

      {/* Stats Grid */}
      <StatsGrid stats={stats} columns={4} />

      {/* Orders DataTable */}
      {isLoading ? (
        <LoadingState message="Loading production orders..." size="lg" />
      ) : !orders || orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No production orders found"
          description={
            <>
              Create orders from{" "}
              <Link href="/crm/projects" className="text-info hover:underline">
                Projects
              </Link>
            </>
          }
        />
      ) : (
        <DataTable
          data={orders}
          columns={columns}
          filters={filters}
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
