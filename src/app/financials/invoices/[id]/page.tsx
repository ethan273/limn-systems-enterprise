"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  const { data: invoice, isLoading, refetch } = api.invoices.getById.useQuery(
    { id: id },
    { enabled: !!id }
  );

  // Update invoice status mutation
  const updateStatusMutation = api.invoices.updateStatus.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice status updated successfully",
      });
      refetch();
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
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="page-container">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>Invoice not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const config = statusConfig[invoice.status] || statusConfig.pending;

  // Get customer info from first invoice item
  const firstOrderItem = invoice.invoice_items[0]?.order_items;
  const customer = firstOrderItem?.orders?.customers;
  const project = firstOrderItem?.orders?.projects;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/financials/invoices")}>
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            Back
          </Button>
          <div>
            <h1 className="page-title">Invoice {invoice.id.substring(0, 8)}</h1>
            <p className="page-description">
              {customer?.company_name || customer?.name || "Invoice Details"}
              {project && ` • ${project.project_name}`}
            </p>
          </div>
        </div>
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
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="pdf">PDF Preview</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Invoice ID</p>
                  <p className="font-medium">{invoice.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{customer?.company_name || customer?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Project</p>
                  <p className="font-medium">{project?.project_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created Date</p>
                  <p className="font-medium">{format(new Date(invoice.created_at), "MMM dd, yyyy")}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Subtotal</p>
                  <p className="font-medium">${Number(invoice.subtotal || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tax</p>
                  <p className="font-medium">${Number(invoice.totalTax || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-medium text-lg">${Number(invoice.total || 0).toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

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
                    {invoice.invoice_items.map((item: any) => (
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
            <CardContent>
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
                <p className="text-muted-foreground">No payments recorded yet</p>
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
            <CardContent>
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
                <p className="text-muted-foreground">No payments allocated to this invoice</p>
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
            <CardContent>
              <p className="text-muted-foreground">No related documents</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PDF Preview Tab */}
        <TabsContent value="pdf">
          <Card>
            <CardHeader>
              <CardTitle>PDF Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <FileText className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>
                  PDF generation feature will be implemented in a future update
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
