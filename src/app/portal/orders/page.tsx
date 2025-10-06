"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import {
  Package,
  Clock,
  Truck,
  CheckCircle2,
  DollarSign,
  Calendar,
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

const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  awaiting_deposit: {
    label: "Awaiting Deposit",
    className: "bg-warning-muted text-warning border-warning",
    icon: <Clock className="w-3 h-3" aria-hidden="true" />,
  },
  deposit_paid: {
    label: "Deposit Paid",
    className: "btn-primary text-info border-primary",
    icon: <DollarSign className="w-3 h-3" aria-hidden="true" />,
  },
  in_progress: {
    label: "In Production",
    className: "btn-primary text-info border-primary",
    icon: <Package className="w-3 h-3" aria-hidden="true" />,
  },
  completed: {
    label: "Completed",
    className: "bg-success-muted text-success border-success",
    icon: <CheckCircle2 className="w-3 h-3" aria-hidden="true" />,
  },
  awaiting_final_payment: {
    label: "Awaiting Final Payment",
    className: "bg-warning-muted text-warning border-warning",
    icon: <Clock className="w-3 h-3" aria-hidden="true" />,
  },
  final_paid: {
    label: "Final Payment Received",
    className: "bg-success-muted text-success border-success",
    icon: <DollarSign className="w-3 h-3" aria-hidden="true" />,
  },
  shipped: {
    label: "Shipped",
    className: "btn-secondary text-secondary border-secondary",
    icon: <Truck className="w-3 h-3" aria-hidden="true" />,
  },
  delivered: {
    label: "Delivered",
    className: "bg-success-muted text-success border-success",
    icon: <CheckCircle2 className="w-3 h-3" aria-hidden="true" />,
  },
};

export default function CustomerOrdersPage() {
  const router = useRouter();

  const { data, isLoading } = api.portal.getCustomerOrders.useQuery({
    status: undefined,
    limit: 50,
    offset: 0,
  });

  const orders = data?.orders || [];

  const stats: StatItem[] = [
    {
      title: 'Total Orders',
      value: orders.length,
      description: 'All production orders',
      icon: Package,
      iconColor: 'primary',
    },
    {
      title: 'Awaiting Deposit',
      value: orders.filter((o) => o.status === "awaiting_deposit").length,
      description: 'Needs payment',
      icon: Clock,
      iconColor: 'warning',
    },
    {
      title: 'In Production',
      value: orders.filter((o) => o.status === "in_progress").length,
      description: 'Currently manufacturing',
      icon: Package,
      iconColor: 'info',
    },
    {
      title: 'Shipped',
      value: orders.filter((o) => o.status === "shipped").length,
      description: 'On the way',
      icon: Truck,
    },
    {
      title: 'Delivered',
      value: orders.filter((o) => o.status === "delivered").length,
      description: 'Completed orders',
      icon: CheckCircle2,
      iconColor: 'success',
    },
  ];

  const columns: DataTableColumn<any>[] = [
    {
      key: 'order_number',
      label: 'Order Number',
      sortable: true,
      render: (value) => <span className="font-mono font-medium">{value as string}</span>,
    },
    {
      key: 'projects',
      label: 'Project',
      render: (value) => <span className="text-sm">{(value as any)?.name || "—"}</span>,
    },
    {
      key: 'item_name',
      label: 'Item',
      render: (value, row) => (
        <div>
          <p className="font-medium">{value as string}</p>
          {row.item_description && (
            <p className="text-xs text-muted-foreground">{row.item_description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'quantity',
      label: 'Quantity',
      sortable: true,
      render: (value) => <span className="font-medium">{value as number}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const config = statusConfig[value as string] || statusConfig.awaiting_deposit;
        return (
          <Badge variant="outline" className={cn(config.className, "flex items-center gap-1 w-fit")}>
            {config.icon}
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: 'production_invoices',
      label: 'Payment Status',
      render: (value) => {
        const depositInvoice = (value as any[] || []).find((inv) => inv.invoice_type === 'deposit');
        const finalInvoice = (value as any[] || []).find((inv) => inv.invoice_type === 'final');

        return (
          <div className="space-y-1">
            {depositInvoice && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  depositInvoice.status === "paid"
                    ? "bg-success-muted text-success border-success"
                    : "bg-warning-muted text-warning border-warning"
                )}
              >
                Deposit: {depositInvoice.status === "paid" ? "Paid" : "Pending"}
              </Badge>
            )}
            {finalInvoice && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  finalInvoice.status === "paid"
                    ? "bg-success-muted text-success border-success"
                    : "bg-warning-muted text-warning border-warning"
                )}
              >
                Final: {finalInvoice.status === "paid" ? "Paid" : "Pending"}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'total_cost',
      label: 'Total',
      sortable: true,
      render: (value) => <span className="font-semibold">${Number(value).toLocaleString()}</span>,
    },
    {
      key: 'estimated_ship_date',
      label: 'Est. Ship Date',
      sortable: true,
      render: (value) => value ? (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
          {format(new Date(value as string), "MMM d, yyyy")}
        </div>
      ) : <span className="text-sm text-muted-foreground">—</span>,
    },
  ];

  const filters: DataTableFilter[] = [
    {
      key: 'search',
      label: 'Search orders',
      type: 'search',
      placeholder: 'Search order number, item name, or project...',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'awaiting_deposit', label: 'Awaiting Deposit' },
        { value: 'deposit_paid', label: 'Deposit Paid' },
        { value: 'in_progress', label: 'In Production' },
        { value: 'completed', label: 'Completed' },
        { value: 'awaiting_final_payment', label: 'Awaiting Final Payment' },
        { value: 'final_paid', label: 'Final Payment Received' },
        { value: 'shipped', label: 'Shipped' },
        { value: 'delivered', label: 'Delivered' },
      ],
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="My Orders"
        subtitle="Track your production orders and shipments"
      />

      <StatsGrid stats={stats} columns={4} />

      {isLoading ? (
        <LoadingState message="Loading orders..." size="lg" />
      ) : !orders || orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders found"
          description="You don't have any production orders yet."
        />
      ) : (
        <DataTable
          data={orders}
          columns={columns}
          filters={filters}
          onRowClick={(row) => router.push(`/portal/orders/${row.id}`)}
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
