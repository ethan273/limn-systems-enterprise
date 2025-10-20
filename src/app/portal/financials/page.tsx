"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { useTableState } from "@/hooks/useTableFilters";
import {
  DollarSign,
  FileText,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
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
import { QuickBooksPaymentButton } from "@/components/portal";

export const dynamic = 'force-dynamic';

const invoiceStatusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  draft: {
    label: "Draft",
    className: "badge-neutral",
    icon: <FileText className="w-3 h-3" aria-hidden="true" />,
  },
  sent: {
    label: "Sent",
    className: "btn-primary text-info border-primary",
    icon: <Clock className="w-3 h-3" aria-hidden="true" />,
  },
  pending: {
    label: "Pending",
    className: "bg-warning-muted text-warning border-warning",
    icon: <Clock className="w-3 h-3" aria-hidden="true" />,
  },
  partial: {
    label: "Partially Paid",
    className: "bg-orange-100 text-warning border-orange-300",
    icon: <DollarSign className="w-3 h-3" aria-hidden="true" />,
  },
  paid: {
    label: "Paid",
    className: "bg-success-muted text-success border-success",
    icon: <CheckCircle2 className="w-3 h-3" aria-hidden="true" />,
  },
  overdue: {
    label: "Overdue",
    className: "bg-destructive-muted text-destructive border-destructive",
    icon: <AlertCircle className="w-3 h-3" aria-hidden="true" />,
  },
  cancelled: {
    label: "Cancelled",
    className: "badge-neutral",
    icon: <FileText className="w-3 h-3" aria-hidden="true" />,
  },
};

const invoiceTypeConfig: Record<string, { label: string; className: string }> = {
  deposit: {
    label: "Deposit (50%)",
    className: "btn-primary text-info border-primary",
  },
  final: {
    label: "Final (50%)",
    className: "btn-secondary text-secondary border-secondary",
  },
  full: {
    label: "Full Payment",
    className: "bg-success-muted text-success border-success",
  },
  custom: {
    label: "Custom",
    className: "badge-neutral",
  },
};

export default function FinancialsPage() {
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
      status: 'all',
    },
    debounceMs: 300,
    pageSize: 100,
  });

  // Backend query with unified params
  const { data, isLoading, error } = api.portal.getCustomerInvoices.useQuery({
    ...queryParams,
    status: rawFilters.status === 'all' ? undefined : rawFilters.status,
  }, {
    enabled: true,
  });

  // Handle query error
  if (error) {
    return (
      <div className="page-container">
        <PageHeader
          title="Financials"
          subtitle="View your invoices and payment history"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load invoices"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.portal.getCustomerInvoices.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  const invoices = data?.invoices || [];

  const stats: StatItem[] = [
    {
      title: 'Total Invoiced',
      value: `$${invoices.reduce((sum, inv) => sum + Number(inv.total), 0).toLocaleString()}`,
      description: 'Total invoice amount',
      icon: FileText,
      iconColor: 'primary',
    },
    {
      title: 'Total Paid',
      value: `$${invoices.reduce((sum, inv) => sum + Number(inv.amount_paid), 0).toLocaleString()}`,
      description: 'Payments received',
      icon: CheckCircle2,
      iconColor: 'success',
    },
    {
      title: 'Total Due',
      value: `$${invoices.reduce((sum, inv) => sum + Number(inv.amount_due), 0).toLocaleString()}`,
      description: 'Outstanding balance',
      icon: DollarSign,
      iconColor: 'destructive',
    },
    {
      title: 'Pending',
      value: invoices.filter((inv) => inv.status === "pending" || inv.status === "sent").length,
      description: 'Awaiting payment',
      icon: Clock,
      iconColor: 'warning',
    },
    {
      title: 'Overdue',
      value: invoices.filter((inv) => inv.status === "overdue").length,
      description: 'Past due date',
      icon: AlertCircle,
      iconColor: 'destructive',
    },
  ];

  // Transform status options to SelectOption format
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'pending', label: 'Pending' },
    { value: 'partial', label: 'Partially Paid' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const columns: DataTableColumn<any>[] = [
    {
      key: 'invoice_number',
      label: 'Invoice Number',
      sortable: true,
      render: (value) => <span className="font-mono font-medium">{value as string}</span>,
    },
    {
      key: 'invoice_type',
      label: 'Type',
      render: (value) => {
        const typeConf = invoiceTypeConfig[value as string] || invoiceTypeConfig.custom;
        return (
          <Badge variant="outline" className={cn(typeConf.className, "text-xs")}>
            {typeConf.label}
          </Badge>
        );
      },
    },
    {
      key: 'projects',
      label: 'Project',
      render: (value) => <span className="text-sm">{(value as any)?.name || "—"}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const statusConf = invoiceStatusConfig[value as string] || invoiceStatusConfig.pending;
        return (
          <Badge variant="outline" className={cn(statusConf.className, "flex items-center gap-1 w-fit")}>
            {statusConf.icon}
            {statusConf.label}
          </Badge>
        );
      },
    },
    {
      key: 'total',
      label: 'Total',
      sortable: true,
      render: (value) => <span className="font-semibold">${Number(value).toLocaleString()}</span>,
    },
    {
      key: 'amount_paid',
      label: 'Paid',
      sortable: true,
      render: (value) => (
        <span className="text-success font-medium">
          ${Number(value).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'amount_due',
      label: 'Due',
      sortable: true,
      render: (value) => (
        <span className={cn(
          "font-medium",
          Number(value) > 0 ? "text-destructive" : "text-success"
        )}>
          ${Number(value).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'due_date',
      label: 'Due Date',
      sortable: true,
      render: (value) => value ? (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
          {format(new Date(value as string), "MMM d, yyyy")}
        </div>
      ) : <span className="text-sm text-muted-foreground">—</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <QuickBooksPaymentButton
          invoiceId={row.id}
          invoiceNumber={row.invoice_number}
          amountDue={Number(row.amount_due)}
          onPaymentSuccess={() => {
            // Refetch invoice data after payment
            window.location.reload();
          }}
        />
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Financials"
        subtitle="View your invoices and payment history"
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
          placeholder="Search invoice number or project..."
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
        {data?.total ? `${data.total} invoice${data.total === 1 ? '' : 's'} found` : 'No invoices found'}
      </div>

      {isLoading ? (
        <LoadingState message="Loading invoices..." size="lg" />
      ) : !invoices || invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices found"
          description={hasActiveFilters
            ? "Try adjusting your filters to see more results."
            : "You don't have any invoices yet."}
        />
      ) : (
        <div className="card">
          <table className="data-table" data-testid="data-table">
            <thead>
              <tr>
                <th>Invoice Number</th>
                <th>Type</th>
                <th>Project</th>
                <th>Status</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Due</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice: any) => {
                const typeConf = invoiceTypeConfig[invoice.invoice_type] || invoiceTypeConfig.custom;
                const statusConf = invoiceStatusConfig[invoice.status] || invoiceStatusConfig.pending;
                return (
                  <tr
                    key={invoice.id}
                    onClick={() => router.push(`/portal/orders/${invoice.production_order_id || invoice.order_id}`)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <td><span className="font-mono font-medium">{invoice.invoice_number}</span></td>
                    <td>
                      <Badge variant="outline" className={cn(typeConf.className, "text-xs")}>
                        {typeConf.label}
                      </Badge>
                    </td>
                    <td><span className="text-sm">{invoice.projects?.name || "—"}</span></td>
                    <td>
                      <Badge variant="outline" className={cn(statusConf.className, "flex items-center gap-1 w-fit")}>
                        {statusConf.icon}
                        {statusConf.label}
                      </Badge>
                    </td>
                    <td><span className="font-semibold">${Number(invoice.total).toLocaleString()}</span></td>
                    <td>
                      <span className="text-success font-medium">
                        ${Number(invoice.amount_paid).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span className={cn(
                        "font-medium",
                        Number(invoice.amount_due) > 0 ? "text-destructive" : "text-success"
                      )}>
                        ${Number(invoice.amount_due).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      {invoice.due_date ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                          {format(new Date(invoice.due_date), "MMM d, yyyy")}
                        </div>
                      ) : <span className="text-sm text-muted-foreground">—</span>}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <QuickBooksPaymentButton
                        invoiceId={invoice.id}
                        invoiceNumber={invoice.invoice_number}
                        amountDue={Number(invoice.amount_due)}
                        onPaymentSuccess={() => {
                          window.location.reload();
                        }}
                      />
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
