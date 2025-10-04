"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  Search,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

const statusConfig: Record<string, { label: string; className: string }> = {
  completed: { label: "Completed", className: "status-completed" },
  pending: { label: "Pending", className: "badge-neutral" },
  failed: { label: "Failed", className: "status-cancelled" },
  refunded: { label: "Refunded", className: "btn-secondary text-secondary border-secondary" },
};

export default function PaymentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");

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

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-description">
            All payments tracking and allocation management
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Total Received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">${stats.totalReceived.toLocaleString()}</div>
            <p className="stat-label">{stats.totalPayments} payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Allocated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value text-success">${stats.totalAllocated.toLocaleString()}</div>
            <p className="stat-label">To invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Unallocated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value text-warning">${stats.totalUnallocated.toLocaleString()}</div>
            <p className="stat-label">Available to allocate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value text-info">{stats.countCompleted}</div>
            <p className="stat-label">Successful payments</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Payments</CardTitle>
        </CardHeader>
        <CardContent className="card-content-compact">
          <div className="filters-section">
            <div className="search-input-wrapper">
              <Search className="search-icon" aria-hidden="true" />
              <Input
                placeholder="Search by payment #, reference #, transaction ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="filter-select">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>

            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="filter-select">
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="wire">Wire Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="loading-state">Loading payments...</div>
      ) : payments.length === 0 ? (
        <div className="empty-state">
          <DollarSign className="empty-state-icon" aria-hidden="true" />
          <h3 className="empty-state-title">No Payments Found</h3>
          <p className="empty-state-description">
            No payments match your current filters.
          </p>
        </div>
      ) : (
        <div className="data-table-container">
          <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Allocated</TableHead>
                    <TableHead>Unallocated</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => {
                    const statusInfo = statusConfig[payment.status || "pending"];

                    return (
                      <TableRow
                        key={payment.id}
                        className="table-row-clickable"
                        onClick={() => router.push(`/financials/payments/${payment.id}`)}
                      >
                        <TableCell className="font-medium">
                          {payment.payment_number || "—"}
                        </TableCell>
                        <TableCell>
                          {payment.created_at && format(new Date(payment.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          {payment.customers ? (
                            <div className="text-sm">
                              <div className="font-medium">
                                {payment.customers.company_name || payment.customers.name}
                              </div>
                              {payment.customers.email && (
                                <div className="text-muted">{payment.customers.email}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {payment.payment_method ? (
                            <Badge variant="outline" className="badge-neutral">
                              <CreditCard className="icon-sm" aria-hidden="true" />
                              <span>{payment.payment_method}</span>
                            </Badge>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          ${Number(payment.amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-success">
                          ${payment.totalAllocated?.toLocaleString() || "0.00"}
                        </TableCell>
                        <TableCell className="text-warning font-medium">
                          ${payment.unallocated?.toLocaleString() || "0.00"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusInfo?.className}>
                            {statusInfo?.label || payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payment.reference_number ? (
                            <div className="text-sm font-mono text-xs">
                              {payment.reference_number}
                            </div>
                          ) : payment.processor_transaction_id ? (
                            <div className="text-sm font-mono text-xs">
                              {payment.processor_transaction_id}
                            </div>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
        </div>
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
