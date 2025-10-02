"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  FileText,
  Clock,
  CheckCircle2,
  Search,
  Calendar,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

const invoiceStatusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  draft: {
    label: "Draft",
    className: "badge-neutral",
    icon: <FileText className="w-3 h-3" aria-hidden="true" />,
  },
  sent: {
    label: "Sent",
    className: "bg-blue-100 text-blue-800 border-blue-300",
    icon: <Clock className="w-3 h-3" aria-hidden="true" />,
  },
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800 border-yellow-300",
    icon: <Clock className="w-3 h-3" aria-hidden="true" />,
  },
  partial: {
    label: "Partially Paid",
    className: "bg-orange-100 text-orange-800 border-orange-300",
    icon: <DollarSign className="w-3 h-3" aria-hidden="true" />,
  },
  paid: {
    label: "Paid",
    className: "bg-green-100 text-green-800 border-green-300",
    icon: <CheckCircle2 className="w-3 h-3" aria-hidden="true" />,
  },
  overdue: {
    label: "Overdue",
    className: "bg-red-100 text-red-800 border-red-300",
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
    className: "bg-blue-100 text-blue-800 border-blue-300",
  },
  final: {
    label: "Final (50%)",
    className: "bg-purple-100 text-purple-800 border-purple-300",
  },
  full: {
    label: "Full Payment",
    className: "bg-green-100 text-green-800 border-green-300",
  },
  custom: {
    label: "Custom",
    className: "badge-neutral",
  },
};

export default function FinancialsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch customer invoices
  const { data, isLoading } = api.portal.getCustomerInvoices.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter as any,
    limit: 100,
    offset: 0,
  });

  const invoices = data?.invoices || [];

  // Client-side search filtering
  const filteredInvoices = invoices.filter((invoice) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      invoice.invoice_number.toLowerCase().includes(searchLower) ||
      invoice.projects?.name?.toLowerCase().includes(searchLower)
    );
  });

  // Calculate financial statistics
  const stats = {
    totalInvoiced: invoices.reduce((sum, inv) => sum + Number(inv.total), 0),
    totalPaid: invoices.reduce((sum, inv) => sum + Number(inv.amount_paid), 0),
    totalDue: invoices.reduce((sum, inv) => sum + Number(inv.amount_due), 0),
    pendingInvoices: invoices.filter((inv) => inv.status === "pending" || inv.status === "sent").length,
    overdueInvoices: invoices.filter((inv) => inv.status === "overdue").length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financials</h1>
          <p className="text-muted-foreground">View your invoices and payment history</p>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalInvoiced.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${stats.totalPaid.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Due</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${stats.totalDue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingInvoices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueInvoices}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" aria-hidden="true" />
                <Input
                  placeholder="Search invoice number or project..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-[250px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partially Paid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading invoices...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
              <p>No invoices found</p>
              {searchQuery && <p className="text-sm mt-2">Try adjusting your search</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => {
                    const statusConf = invoiceStatusConfig[invoice.status] || invoiceStatusConfig.pending;
                    const typeConf = invoiceTypeConfig[invoice.invoice_type] || invoiceTypeConfig.custom;

                    return (
                      <TableRow
                        key={invoice.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/portal/orders/${invoice.production_order_id || invoice.order_id}`)}
                      >
                        <TableCell>
                          <span className="font-mono font-medium">{invoice.invoice_number}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(typeConf.className, "text-xs")}>
                            {typeConf.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{invoice.projects?.name || "—"}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(statusConf.className, "flex items-center gap-1 w-fit")}>
                            {statusConf.icon}
                            {statusConf.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">${Number(invoice.total).toLocaleString()}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-green-600 font-medium">
                            ${Number(invoice.amount_paid).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            "font-medium",
                            Number(invoice.amount_due) > 0 ? "text-red-600" : "text-green-600"
                          )}>
                            ${Number(invoice.amount_due).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          {invoice.due_date ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                              {format(new Date(invoice.due_date), "MMM d, yyyy")}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/portal/orders/${invoice.production_order_id || invoice.order_id}`);
                            }}
                          >
                            View Order
                          </Button>
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

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Transaction ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices
                .flatMap((inv) =>
                  (inv.production_payments || []).map((payment) => ({
                    ...payment,
                    invoice_number: inv.invoice_number,
                    invoice_id: inv.id,
                  }))
                )
                .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
                .slice(0, 10)
                .map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                        {format(new Date(payment.payment_date), "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{payment.invoice_number}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-green-600">
                        ${Number(payment.amount).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                        <span className="capitalize text-sm">{payment.payment_method}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground">
                        {payment.transaction_id || "—"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              {invoices.flatMap((inv) => inv.production_payments || []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
                    <p>No payment history available</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
