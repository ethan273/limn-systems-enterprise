"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft,
  XCircle,
  Clock,
  RotateCcw,
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
  processed: {
    label: "Processed",
    className: "bg-success-muted text-success border-success",
    icon: <CheckCircle2 className="w-4 h-4" aria-hidden="true" />,
  },
  failed: {
    label: "Failed",
    className: "bg-destructive-muted text-destructive border-destructive",
    icon: <XCircle className="w-4 h-4" aria-hidden="true" />,
  },
  refunded: {
    label: "Refunded",
    className: "btn-primary text-info border-primary",
    icon: <RotateCcw className="w-4 h-4" aria-hidden="true" />,
  },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PaymentDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  // Fetch payment details
  const { data: payment, isLoading, refetch } = api.payments.getById.useQuery(
    { id: id },
    { enabled: !!id }
  );

  // Update payment status mutation
  const updateStatusMutation = api.payments.updateStatus.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment status updated successfully",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment status",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (newStatus: string) => {
    updateStatusMutation.mutate({
      id: id,
      status: newStatus as "pending" | "processed" | "failed" | "refunded",
    });
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="page-container">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>Payment not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const config = statusConfig[payment.status] || statusConfig.pending;

  // Get customer info from payment allocations
  const firstAllocation = payment.payment_allocations?.[0];
  const customer = firstAllocation?.invoices?.invoice_items?.[0]?.order_items?.orders?.customers;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/financials/payments")}>
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            Back
          </Button>
          <div>
            <h1 className="page-title">Payment {payment.payment_number || payment.id.substring(0, 8)}</h1>
            <p className="page-description">
              {customer?.company_name || customer?.name || "Payment Details"}
            </p>
          </div>
        </div>
        <Select value={payment.status} onValueChange={handleStatusChange}>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${Number(payment.amount || 0).toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">{payment.payment_method || "N/A"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Payment Date</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">
              {payment.payment_date ? format(new Date(payment.payment_date), "MMM dd, yyyy") : "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Payment Number</p>
              <p className="font-medium">{payment.payment_number || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment ID</p>
              <p className="font-medium">{payment.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Date</p>
              <p className="font-medium">
                {payment.payment_date ? format(new Date(payment.payment_date), "MMM dd, yyyy") : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Method</p>
              <p className="font-medium">{payment.payment_method || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reference Number</p>
              <p className="font-medium">{payment.reference_number || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="font-medium text-lg">${Number(payment.amount || 0).toFixed(2)}</p>
            </div>
          </div>

          {payment.notes && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">Notes</p>
              <p className="font-medium">{payment.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Allocated Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Allocated Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {payment.payment_allocations && payment.payment_allocations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Invoice</th>
                    <th className="text-left p-2">Customer</th>
                    <th className="text-right p-2">Allocated Amount</th>
                    <th className="text-left p-2">Allocation Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payment.payment_allocations.map((allocation: any) => {
                    const invoiceCustomer = allocation.invoices?.invoice_items?.[0]?.order_items?.orders?.customers;
                    return (
                      <tr key={allocation.id} className="border-b">
                        <td className="p-2">
                          <p className="font-medium">{allocation.invoices?.id?.substring(0, 8) || "N/A"}</p>
                        </td>
                        <td className="p-2">
                          {invoiceCustomer?.company_name || invoiceCustomer?.name || "N/A"}
                        </td>
                        <td className="text-right p-2 font-medium text-success">
                          ${Number(allocation.allocated_amount).toFixed(2)}
                        </td>
                        <td className="p-2">
                          {allocation.created_at && format(new Date(allocation.created_at), "MMM dd, yyyy")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground">No invoices allocated to this payment</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
