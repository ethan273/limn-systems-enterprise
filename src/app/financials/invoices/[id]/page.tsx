"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EntityDetailHeader } from "@/components/common/EntityDetailHeader";
import { InfoCard } from "@/components/common/InfoCard";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  ArrowLeft,
  XCircle,
  Clock,
  CreditCard,
  Building2,
  Calendar,
  DollarSign,
  Edit,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

// Dynamic route configuration
export const dynamic = 'force-dynamic';

const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  pending: {
    label: "Pending",
    className: "badge-neutral",
    icon: <Clock className="w-4 h-4" aria-hidden="true" />,
  },
  partial: {
    label: "Partial",
    className: "btn-primary text-info border-primary",
    icon: <CreditCard className="w-4 h-4" aria-hidden="true" />,
  },
  paid: {
    label: "Paid",
    className: "bg-success-muted text-success border-success",
    icon: <CheckCircle2 className="w-4 h-4" aria-hidden="true" />,
  },
  overdue: {
    label: "Overdue",
    className: "bg-destructive-muted text-destructive border-destructive",
    icon: <AlertCircle className="w-4 h-4" aria-hidden="true" />,
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-muted text-muted border-muted",
    icon: <XCircle className="w-4 h-4" aria-hidden="true" />,
  },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function InvoiceDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch invoice details
  const { data: invoice, isLoading } = api.invoices.getById.useQuery(
    { id: id },
    { enabled: !!id }
  );

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Update invoice status mutation
  const updateStatusMutation = api.invoices.updateStatus.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice status updated successfully",
      });
      // Invalidate queries for instant updates
      utils.invoices.getById.invalidate({ id });
      utils.invoices.getAll.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update invoice status",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (newStatus: string) => {
    updateStatusMutation.mutate({
      id: id,
      status: newStatus as "pending" | "partial" | "paid" | "overdue" | "cancelled",
    });
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading invoice details..." size="md" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="page-container">
        <EmptyState
          icon={AlertCircle}
          title="Invoice Not Found"
          description="The invoice you're looking for doesn't exist or you don't have permission to view it."
          action={{
            label: 'Back to Invoices',
            onClick: () => router.push("/financials/invoices"),
            icon: ArrowLeft,
          }}
        />
      </div>
    );
  }

  const config = statusConfig[invoice.status] || statusConfig.pending;

  // Get customer info from first invoice item
  const firstOrderItem = invoice.invoice_items?.[0]?.order_items;
  const customer = firstOrderItem?.orders?.customers;
  const project = firstOrderItem?.orders?.projects;

  return (
    <div className="page-container">
      {/* Header Section */}
      <div className="page-header">
        <Button
          onClick={() => router.push("/financials/invoices")}
          variant="ghost"
          className="btn-secondary"
        >
          <ArrowLeft className="icon-sm" aria-hidden="true" />
          Back
        </Button>
      </div>

      {/* Invoice Header */}
      <EntityDetailHeader
        icon={FileText}
        title={`Invoice ${invoice.id.substring(0, 8)}`}
        subtitle={customer?.company_name || customer?.name || undefined}
        metadata={[
          ...(project ? [{ icon: Building2, value: project.project_name, label: 'Project' }] : []),
          { icon: Calendar, value: format(new Date(invoice.created_at), "MMM dd, yyyy"), label: 'Created' },
          { icon: DollarSign, value: `$${Number(invoice.total || 0).toFixed(2)}`, label: 'Total Amount' },
        ]}
        status={invoice.status}
        actions={[
          {
            label: 'Edit Invoice',
            icon: Edit,
            onClick: () => router.push(`/financials/invoices/${invoice.id}/edit`),
          },
        ]}
      />

      {/* Status Update Control */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Update Status:</span>
          <Select value={invoice.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(statusConfig).map(([status, { label, icon }]) => (
                <SelectItem key={status} value={status}>
                  <div className="flex items-center gap-2">
                    {icon}
                    <span>{label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={config.className}>
              <span className="flex items-center gap-1">
                {config.icon}
                {config.label}
              </span>
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${Number(invoice.total || 0).toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Amount Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">${Number(invoice.totalPaid || 0).toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Balance Due</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">${Number(invoice.balance || 0).toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="tabs-list">
          <TabsTrigger value="overview" className="tabs-trigger">Overview</TabsTrigger>
          <TabsTrigger value="payments" className="tabs-trigger">Payments</TabsTrigger>
          <TabsTrigger value="documents" className="tabs-trigger">Documents</TabsTrigger>
          <TabsTrigger value="pdf" className="tabs-trigger">PDF Preview</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard
              title="Invoice Details"
              items={[
                { label: 'Invoice ID', value: invoice.id },
                { label: 'Customer', value: customer?.company_name || customer?.name || "N/A" },
                { label: 'Project', value: project?.project_name || "N/A" },
                { label: 'Created Date', value: format(new Date(invoice.created_at), "MMM dd, yyyy") },
              ]}
            />
            <InfoCard
              title="Invoice Totals"
              items={[
                { label: 'Subtotal', value: `$${Number(invoice.subtotal || 0).toFixed(2)}` },
                { label: 'Tax', value: `$${Number(invoice.totalTax || 0).toFixed(2)}` },
                { label: 'Total', value: `$${Number(invoice.total || 0).toFixed(2)}` },
              ]}
            />
          </div>

          {/* Line Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Description</th>
                      <th className="text-right p-2">Quantity</th>
                      <th className="text-right p-2">Unit Price</th>
                      <th className="text-right p-2">Discount</th>
                      <th className="text-right p-2">Tax</th>
                      <th className="text-right p-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(invoice.invoice_items || []).map((item: any) => (
                      <tr key={item.id} className="border-b">
                        <td className="p-2">{item.description}</td>
                        <td className="text-right p-2">{Number(item.quantity)}</td>
                        <td className="text-right p-2">${Number(item.unit_price || 0).toFixed(2)}</td>
                        <td className="text-right p-2">${Number(item.discount_amount || 0).toFixed(2)}</td>
                        <td className="text-right p-2">${Number(item.tax_amount || 0).toFixed(2)}</td>
                        <td className="text-right p-2 font-medium">${Number(item.line_total || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent className="card-content-compact">
              {invoice.payment_allocations && invoice.payment_allocations.length > 0 ? (
                <div className="space-y-2">
                  {invoice.payment_allocations.map((allocation: any) => (
                    <div key={allocation.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{allocation.payments?.payment_number || "Payment"}</p>
                        <p className="text-sm text-muted-foreground">
                          {allocation.payments?.payment_date && format(new Date(allocation.payments.payment_date), "MMM dd, yyyy")}
                          {" • "}
                          {allocation.payments?.payment_method || "N/A"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-success">${Number(allocation.allocated_amount).toFixed(2)}</p>
                        <Badge className="bg-success-muted text-success border-success">
                          {allocation.payments?.status || "processed"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={CreditCard}
                  title="No Payments"
                  description="No payments recorded yet"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment Allocations</CardTitle>
            </CardHeader>
            <CardContent className="card-content-compact">
              {invoice.payment_allocations && invoice.payment_allocations.length > 0 ? (
                <div className="space-y-4">
                  {invoice.payment_allocations.map((allocation: any) => (
                    <div key={allocation.id} className="p-4 border rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Payment Number</p>
                          <p className="font-medium">{allocation.payments?.payment_number || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Payment Date</p>
                          <p className="font-medium">
                            {allocation.payments?.payment_date && format(new Date(allocation.payments.payment_date), "MMM dd, yyyy")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Payment Method</p>
                          <p className="font-medium">{allocation.payments?.payment_method || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Allocated Amount</p>
                          <p className="font-medium text-success">${Number(allocation.allocated_amount).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={CreditCard}
                  title="No Payment Allocations"
                  description="No payments allocated to this invoice"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Related Documents</CardTitle>
            </CardHeader>
            <CardContent className="card-content-compact">
              <EmptyState
                icon={FileText}
                title="No Documents"
                description="No related documents"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* PDF Preview Tab */}
        <TabsContent value="pdf">
          <Card>
            <CardHeader>
              <CardTitle>PDF Preview</CardTitle>
            </CardHeader>
            <CardContent className="card-content-compact">
              <EmptyState
                icon={FileText}
                title="PDF Preview Coming Soon"
                description="PDF generation feature will be implemented in a future update"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
