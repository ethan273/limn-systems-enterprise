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
  FileText,
  Search,
} from "lucide-react";
import { format } from "date-fns";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "badge-neutral" },
  partial: { label: "Partial", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  paid: { label: "Paid", className: "status-completed" },
  overdue: { label: "Overdue", className: "status-cancelled" },
};

export default function InvoicesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading } = api.invoices.getAll.useQuery(
    {
      search: searchQuery || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      limit: 100,
      offset: 0,
    },
    {
      enabled: !!user,
    }
  );

  const { data: statsData } = api.invoices.getStats.useQuery(
    {},
    {
      enabled: !!user,
    }
  );

  const invoices = data?.items || [];
  const stats = statsData || {
    totalInvoices: 0,
    totalInvoiced: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    countPaid: 0,
    countPartial: 0,
    countPending: 0,
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-description">
            General accounting invoices and payment tracking
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Total Invoiced</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">${stats.totalInvoiced.toLocaleString()}</div>
            <p className="stat-label">{stats.totalInvoices} invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value text-green-600">${stats.totalPaid.toLocaleString()}</div>
            <p className="stat-label">{stats.countPaid} paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value text-yellow-600">${stats.totalOutstanding.toLocaleString()}</div>
            <p className="stat-label">{stats.countPending + stats.countPartial} pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="card-header-sm">
            <CardTitle className="card-title-sm">Collection Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value text-blue-600">
              {stats.totalInvoiced > 0
                ? Math.round((stats.totalPaid / stats.totalInvoiced) * 100)
                : 0}%
            </div>
            <p className="stat-label">Payment rate</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Invoices</CardTitle>
        </CardHeader>
        <CardContent className="card-content-compact">
          <div className="filters-section">
            <div className="search-input-wrapper">
              <Search className="search-icon" aria-hidden="true" />
              <Input
                placeholder="Search invoices..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoices ({invoices.length})</CardTitle>
        </CardHeader>
        <CardContent className="card-content-compact">
          {isLoading ? (
            <div className="loading-state">Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div className="empty-state">
              <FileText className="empty-state-icon" aria-hidden="true" />
              <h3 className="empty-state-title">No Invoices Found</h3>
              <p className="empty-state-description">
                No invoices match your current filters.
              </p>
            </div>
          ) : (
            <div className="table-container">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => {
                    const statusInfo = statusConfig[invoice.status || "pending"];

                    return (
                      <TableRow
                        key={invoice.id}
                        className="table-row-clickable"
                        onClick={() => router.push(`/financials/invoices/${invoice.id}`)}
                      >
                        <TableCell>
                          {invoice.created_at && format(new Date(invoice.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          {invoice.customer ? (
                            <div className="text-sm">
                              <div className="font-medium">
                                {invoice.customer.company_name || invoice.customer.name}
                              </div>
                              {invoice.customer.email && (
                                <div className="text-muted">{invoice.customer.email}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {invoice.project ? (
                            <div className="text-sm">{invoice.project.project_name}</div>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="badge-neutral">
                            {invoice.invoice_items.length} items
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          ${invoice.total?.toLocaleString() || "0.00"}
                        </TableCell>
                        <TableCell className="text-green-600">
                          ${invoice.totalPaid?.toLocaleString() || "0.00"}
                        </TableCell>
                        <TableCell className="font-medium">
                          ${invoice.balance?.toLocaleString() || "0.00"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusInfo?.className}>
                            {statusInfo?.label || invoice.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
