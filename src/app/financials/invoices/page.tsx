"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api/client";
import { useInvoicesRealtime } from "@/hooks/useRealtimeSubscription";
import { FileText, DollarSign, Clock, CheckCircle2, Download, Plus, AlertTriangle, RefreshCw } from "lucide-react";
import { format } from "date-fns";
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
import { DataErrorBoundary } from "@/components/error-handling";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

function InvoicesPageContent() {
  const router = useRouter();
  const { user: _user } = useAuth();
  const [searchQuery, _setSearchQuery] = useState("");
  const [statusFilter, _setStatusFilter] = useState<string>("all");

  const { data, isLoading, error } = api.invoices.getAll.useQuery(
    {
      search: searchQuery || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      limit: 100,
      offset: 0,
    },
    {
      enabled: true,
    }
  );

  const { data: statsData, error: statsError } = api.invoices.getStats.useQuery(
    {},
    {
      enabled: true,
    }
  );

  const utils = api.useUtils();

  const invoices = data?.items || [];

  // Export to CSV handler
  const handleExportCSV = () => {
    if (!invoices || invoices.length === 0) {
      alert('No invoices to export');
      return;
    }

    // CSV headers
    const headers = [
      'Invoice Date',
      'Customer Name',
      'Customer Email',
      'Project',
      'Items Count',
      'Total',
      'Paid',
      'Balance',
      'Status'
    ];

    // CSV rows
    const rows = invoices.map((invoice: any) => [
      invoice.created_at ? format(new Date(invoice.created_at), 'yyyy-MM-dd') : '',
      invoice.customer?.company_name || invoice.customer?.name || '',
      invoice.customer?.email || '',
      invoice.project?.project_name || '',
      invoice.invoice_items?.length || 0,
      invoice.total || 0,
      invoice.totalPaid || 0,
      invoice.balance || 0,
      invoice.status || ''
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(','))
    ].join('\n');

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `invoices_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const stats = statsData || {
    totalInvoices: 0,
    totalInvoiced: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    countPaid: 0,
    countPartial: 0,
    countPending: 0,
  };

  // Subscribe to realtime updates for invoices
  useInvoicesRealtime({
    queryKey: ['invoices', 'getAll'],
    enabled: true,
  });

  // Stats configuration
  const statItems: StatItem[] = [
    {
      title: 'Total Invoiced',
      value: `$${stats.totalInvoiced.toLocaleString()}`,
      description: `${stats.totalInvoices} invoices`,
      icon: DollarSign,
      iconColor: 'info',
    },
    {
      title: 'Total Paid',
      value: `$${stats.totalPaid.toLocaleString()}`,
      description: `${stats.countPaid} paid`,
      icon: CheckCircle2,
      iconColor: 'success',
    },
    {
      title: 'Outstanding',
      value: `$${stats.totalOutstanding.toLocaleString()}`,
      description: `${stats.countPending + stats.countPartial} pending`,
      icon: Clock,
      iconColor: 'warning',
    },
    {
      title: 'Collection Rate',
      value: `${stats.totalInvoiced > 0 ? Math.round((stats.totalPaid / stats.totalInvoiced) * 100) : 0}%`,
      description: 'Payment rate',
      icon: DollarSign,
      iconColor: 'info',
    },
  ];

  // DataTable columns configuration
  const columns: DataTableColumn<any>[] = [
    {
      key: 'created_at',
      label: 'Invoice Date',
      sortable: true,
      render: (value) => value ? format(new Date(value as string), "MMM d, yyyy") : '—',
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (value: any) => {
        if (!value) return <span className="text-muted">—</span>;
        return (
          <div className="text-sm">
            <div className="font-medium">{value.company_name || value.name}</div>
            {value.email && <div className="text-muted">{value.email}</div>}
          </div>
        );
      },
    },
    {
      key: 'project',
      label: 'Project',
      render: (value: any) => value?.project_name ? (
        <div className="text-sm">{value.project_name}</div>
      ) : <span className="text-muted">—</span>,
    },
    {
      key: 'invoice_items',
      label: 'Items',
      render: (value: any) => (
        <StatusBadge status={`${value?.length || 0} items`} />
      ),
    },
    {
      key: 'total',
      label: 'Total',
      sortable: true,
      render: (value) => (
        <span className="font-medium">${(value as number)?.toLocaleString() || "0.00"}</span>
      ),
    },
    {
      key: 'totalPaid',
      label: 'Paid',
      render: (value) => (
        <span className="text-success">${(value as number)?.toLocaleString() || "0.00"}</span>
      ),
    },
    {
      key: 'balance',
      label: 'Balance',
      render: (value) => (
        <span className="font-medium">${(value as number)?.toLocaleString() || "0.00"}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => value ? <StatusBadge status={value as string} /> : null,
    },
  ];

  // DataTable filters configuration
  const filters: DataTableFilter[] = [
    {
      key: 'search',
      label: 'Search invoices',
      type: 'search',
      placeholder: 'Search invoices...',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'pending', label: 'Pending' },
        { value: 'partial', label: 'Partial' },
        { value: 'paid', label: 'Paid' },
        { value: 'overdue', label: 'Overdue' },
      ],
    },
  ];

  // Handle errors
  if (error || statsError) {
    return (
      <div className="page-container">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <AlertTriangle className="w-12 h-12 text-destructive" aria-hidden="true" />
          <h2 className="text-2xl font-semibold">Failed to Load Invoices</h2>
          <p className="text-muted-foreground text-center max-w-md">
            {error?.message || statsError?.message || "An unexpected error occurred while loading invoices data."}
          </p>
          <button
            onClick={() => {
              utils.invoices.getAll.invalidate();
              utils.invoices.getStats.invalidate();
            }}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader
        title="Invoices"
        subtitle="General accounting invoices and payment tracking"
        actions={[
          {
            label: 'Export CSV',
            icon: Download,
            onClick: handleExportCSV,
            variant: 'outline' as const,
          },
          {
            label: 'Create Invoice',
            icon: Plus,
            onClick: () => router.push('/financials/invoices/new'),
            variant: 'default' as const,
          },
        ]}
      />

      {/* Stats */}
      <StatsGrid stats={statItems} columns={4} />

      {/* Invoices DataTable */}
      {isLoading ? (
        <LoadingState message="Loading invoices..." size="lg" />
      ) : !invoices || invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Invoices Found"
          description="No invoices match your current filters."
        />
      ) : (
        <DataTable
          data={invoices}
          columns={columns}
          filters={filters}
          onRowClick={(row) => router.push(`/financials/invoices/${row.id}`)}
          pagination={{ pageSize: 20, showSizeSelector: true }}
          emptyState={{
            icon: FileText,
            title: 'No invoices match your filters',
            description: 'Try adjusting your search or filter criteria',
          }}
        />
      )}
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <DataErrorBoundary context="invoices">
      <InvoicesPageContent />
    </DataErrorBoundary>
  );
}
