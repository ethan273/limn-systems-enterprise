"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api/client";
import { DollarSign, CreditCard, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

// Dynamic route configuration
export const dynamic = 'force-dynamic';

export default function PaymentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, _setSearchQuery] = useState("");
  const [statusFilter, _setStatusFilter] = useState<string>("all");
  const [methodFilter, _setMethodFilter] = useState<string>("all");

  const { data, isLoading } = api.payments.getAll.useQuery(
    {
      search: searchQuery || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      paymentMethod: methodFilter === "all" ? undefined : methodFilter,
      limit: 100,
      offset: 0,
    },
    {
      enabled: !!user,
    }
  );

  const { data: statsData } = api.payments.getStats.useQuery(
    {},
    {
      enabled: !!user,
    }
  );

  const payments = data?.items || [];
  const stats = statsData || {
    totalPayments: 0,
    totalReceived: 0,
    totalAllocated: 0,
    totalUnallocated: 0,
    countCompleted: 0,
    countPending: 0,
    countFailed: 0,
    byMethod: {},
  };

  // Stats configuration
  const statItems: StatItem[] = [
    {
      title: 'Total Received',
      value: `$${stats.totalReceived.toLocaleString()}`,
      description: `${stats.totalPayments} payments`,
      icon: DollarSign,
      iconColor: 'info',
    },
    {
      title: 'Allocated',
      value: `$${stats.totalAllocated.toLocaleString()}`,
      description: 'To invoices',
      icon: CheckCircle2,
      iconColor: 'success',
    },
    {
      title: 'Unallocated',
      value: `$${stats.totalUnallocated.toLocaleString()}`,
      description: 'Available to allocate',
      icon: Clock,
      iconColor: 'warning',
    },
    {
      title: 'Completed',
      value: stats.countCompleted,
      description: 'Successful payments',
      icon: CheckCircle2,
      iconColor: 'info',
    },
  ];

  // DataTable columns configuration
  const columns: DataTableColumn<any>[] = [
    {
      key: 'payment_number',
      label: 'Payment #',
      render: (value) => (
        <span className="font-medium">{value as string || "—"}</span>
      ),
    },
    {
      key: 'created_at',
      label: 'Date',
      sortable: true,
      render: (value) => value ? format(new Date(value as string), "MMM d, yyyy") : '—',
    },
    {
      key: 'customers',
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
      key: 'payment_method',
      label: 'Method',
      render: (value) => value ? (
        <div className="flex items-center gap-2">
          <CreditCard className="icon-sm text-muted" aria-hidden="true" />
          <span className="text-sm">{value as string}</span>
        </div>
      ) : <span className="text-muted">—</span>,
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value) => (
        <span className="font-medium">${Number(value || 0).toLocaleString()}</span>
      ),
    },
    {
      key: 'totalAllocated',
      label: 'Allocated',
      render: (value) => (
        <span className="text-success">${(value as number)?.toLocaleString() || "0.00"}</span>
      ),
    },
    {
      key: 'unallocated',
      label: 'Unallocated',
      render: (value) => (
        <span className="text-warning font-medium">${(value as number)?.toLocaleString() || "0.00"}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => value ? <StatusBadge status={value as string} /> : null,
    },
    {
      key: 'reference_number',
      label: 'Reference',
      render: (value, row) => {
        if (value) {
          return <div className="text-sm font-mono text-xs">{value as string}</div>;
        }
        if (row.processor_transaction_id) {
          return <div className="text-sm font-mono text-xs">{row.processor_transaction_id}</div>;
        }
        return <span className="text-muted">—</span>;
      },
    },
  ];

  // DataTable filters configuration
  const filters: DataTableFilter[] = [
    {
      key: 'search',
      label: 'Search payments',
      type: 'search',
      placeholder: 'Search by payment #, reference #, transaction ID...',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'completed', label: 'Completed' },
        { value: 'pending', label: 'Pending' },
        { value: 'failed', label: 'Failed' },
        { value: 'refunded', label: 'Refunded' },
      ],
    },
    {
      key: 'paymentMethod',
      label: 'Payment Method',
      type: 'select',
      options: [
        { value: 'all', label: 'All Methods' },
        { value: 'credit_card', label: 'Credit Card' },
        { value: 'bank_transfer', label: 'Bank Transfer' },
        { value: 'check', label: 'Check' },
        { value: 'cash', label: 'Cash' },
        { value: 'wire', label: 'Wire Transfer' },
      ],
    },
  ];

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader
        title="Payments"
        subtitle="All payments tracking and allocation management"
      />

      {/* Stats */}
      <StatsGrid stats={statItems} columns={4} />

      {/* Payments DataTable */}
      {isLoading ? (
        <LoadingState message="Loading payments..." size="lg" />
      ) : !payments || payments.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No Payments Found"
          description="No payments match your current filters."
        />
      ) : (
        <DataTable
          data={payments}
          columns={columns}
          filters={filters}
          onRowClick={(row) => router.push(`/financials/payments/${row.id}`)}
          pagination={{ pageSize: 20, showSizeSelector: true }}
          emptyState={{
            icon: DollarSign,
            title: 'No payments match your filters',
            description: 'Try adjusting your search or filter criteria',
          }}
        />
      )}

      {/* Payment Methods Breakdown */}
      {Object.keys(stats.byMethod).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.byMethod).map(([method, amount]) => (
                <div key={method} className="text-center p-4 border rounded-lg">
                  <p className="text-sm text-muted mb-1 capitalize">{method.replace(/_/g, " ")}</p>
                  <p className="text-lg font-semibold">${Number(amount).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
