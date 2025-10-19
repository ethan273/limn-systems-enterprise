'use client';

import { useState } from 'react';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { QuickBooksPaymentButton } from '@/components/portal/QuickBooksPaymentButton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DollarSign,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

/**
 * Customer Portal Financials Page
 * View invoices, make payments, download receipts
 */
export default function CustomerFinancialsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: invoicesData, isLoading, error } = api.portal.getCustomerInvoices.useQuery({
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: 100,
    offset: 0,
  });

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  const invoices = invoicesData?.invoices || [];

  // Calculate summary stats
  const totalOutstanding = invoices
    .filter((inv: any) => inv.status === 'pending' || inv.status === 'partial')
    .reduce((sum: number, inv: any) => sum + Number(inv.balance || 0), 0);

  const totalPaid = invoices
    .filter((inv: any) => inv.status === 'paid')
    .reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0);

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(amount));
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: any }> = {
      paid: { label: 'Paid', variant: 'default', icon: CheckCircle },
      partial: { label: 'Partially Paid', variant: 'secondary', icon: Clock },
      pending: { label: 'Pending', variant: 'outline', icon: AlertCircle },
      overdue: { label: 'Overdue', variant: 'destructive', icon: AlertCircle },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: 'outline' as const,
      icon: FileText
    };

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <config.icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Handle query error
  if (error) {
    return (
      <div className="space-y-6">
        <div className="page-header">
          <h1 className="page-title">Financials</h1>
          <p className="page-subtitle">View invoices and manage payments</p>
        </div>
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Financials</h1>
        <p className="page-subtitle">View invoices and manage payments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <AlertCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{formatCurrency(totalOutstanding)}</div>
            <p className="text-xs text-muted-foreground">Amount due</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(totalPaid)}</div>
            <p className="text-xs text-muted-foreground">All-time payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
            <p className="text-xs text-muted-foreground">All invoices</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full md:w-[200px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="partial">Partially Paid</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoices ({invoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading invoices...
            </div>
          ) : invoices.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No invoices found"
              description={
                statusFilter === 'all'
                  ? 'No invoices have been generated yet'
                  : 'No invoices match the selected filter'
              }
            />
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice: any) => (
                <div
                  key={invoice.id}
                  className="border rounded-lg p-6 hover:bg-muted/50 transition-colors"
                >
                  {/* Invoice Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          Invoice #{invoice.invoice_number || 'N/A'}
                        </h3>
                        {getStatusBadge(invoice.status)}
                      </div>
                      {invoice.production_orders && (
                        <p className="text-sm text-muted-foreground">
                          Order: {invoice.production_orders.order_number}
                        </p>
                      )}
                      {invoice.projects && (
                        <p className="text-xs text-muted-foreground">
                          Project: {invoice.projects.project_name}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{formatCurrency(invoice.total)}</p>
                      {invoice.balance > 0 && (
                        <p className="text-sm text-warning font-medium">
                          Balance: {formatCurrency(invoice.balance)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Invoice Details */}
                  <div className="grid gap-4 md:grid-cols-3 mb-4 pb-4 border-b">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Invoice Date
                      </p>
                      <p className="text-sm">{formatDate(invoice.invoice_date)}</p>
                    </div>
                    {invoice.due_date && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Due Date
                        </p>
                        <p className="text-sm">{formatDate(invoice.due_date)}</p>
                      </div>
                    )}
                    {invoice.payment_date && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Paid Date
                        </p>
                        <p className="text-sm text-success">{formatDate(invoice.payment_date)}</p>
                      </div>
                    )}
                  </div>

                  {/* Payment Breakdown */}
                  <div className="grid gap-3 md:grid-cols-3 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                    </div>
                    {invoice.tax_amount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax:</span>
                        <span className="font-medium">{formatCurrency(invoice.tax_amount)}</span>
                      </div>
                    )}
                    {invoice.total_paid > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Paid:</span>
                        <span className="font-medium text-success">
                          {formatCurrency(invoice.total_paid)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    {/* Download Invoice */}
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>

                    {/* Make Payment (only if balance > 0) */}
                    {invoice.balance > 0 && (
                      <QuickBooksPaymentButton
                        invoiceId={invoice.id}
                        invoiceNumber={invoice.invoice_number || 'N/A'}
                        amountDue={Number(invoice.balance)}
                        onPaymentSuccess={() => {
                          // Invalidate queries for instant updates
                          utils.portal.getCustomerInvoices.invalidate();
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">QuickBooks Payments</h4>
            <p className="text-sm text-muted-foreground">
              We use QuickBooks for secure payment processing. Click &quot;Pay Now&quot; on any invoice to
              complete your payment via QuickBooks.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Payment Questions?</h4>
            <p className="text-sm text-muted-foreground">
              If you have questions about invoices or payments, please contact our accounting team.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
