"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EntityDetailHeader,
  InfoCard,
  StatusBadge,
  LoadingState,
  EmptyState,
  type EntityMetadata,
} from "@/components/common";
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
  DollarSign,
  Calendar,
  CreditCard,
  AlertTriangle,
  RefreshCw,
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
  const { data: payment, isLoading, error } = api.payments.getById.useQuery(
    { id: id },
    { enabled: !!id }
  );

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  // Update payment status mutation
  const updateStatusMutation = api.payments.updateStatus.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment status updated successfully",
      });
      // Invalidate queries for instant updates
      utils.payments.getById.invalidate({ id });
      utils.payments.getAll.invalidate();
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
        <LoadingState message="Loading payment details..." size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <AlertTriangle className="w-12 h-12 text-destructive" aria-hidden="true" />
          <h2 className="text-2xl font-semibold">Failed to Load Payment</h2>
          <p className="text-muted-foreground text-center max-w-md">
            {error.message || "An unexpected error occurred while loading the payment."}
          </p>
          <button
            onClick={() => utils.payments.getById.invalidate({ id })}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="page-container">
        <EmptyState
          icon={AlertCircle}
          title="Payment Not Found"
          description="The payment you're looking for doesn't exist or you don't have permission to view it."
          action={{
            label: 'Back to Payments',
            onClick: () => router.push("/financials/payments"),
            icon: ArrowLeft,
          }}
        />
      </div>
    );
  }

  // Get customer info from payment allocations
  const firstAllocation = payment.payment_allocations?.[0];
  const customer = firstAllocation?.invoices?.invoice_items?.[0]?.order_items?.orders?.customers;

  const metadata: EntityMetadata[] = [
    { icon: DollarSign, value: `$${Number(payment.amount || 0).toFixed(2)}`, label: 'Amount' },
    { icon: Calendar, value: payment.payment_date ? format(new Date(payment.payment_date), "MMM dd, yyyy") : "N/A", label: 'Payment Date' },
    { icon: CreditCard, value: payment.payment_method || "N/A", label: 'Method' },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <Button variant="ghost" onClick={() => router.push("/financials/payments")} className="btn-secondary">
          <ArrowLeft className="icon-sm" aria-hidden="true" />
          Back
        </Button>
      </div>

      <EntityDetailHeader
        icon={DollarSign}
        title={`Payment ${payment.payment_number || payment.id.substring(0, 8)}`}
        subtitle={customer?.company_name || customer?.name || "Payment Details"}
        metadata={metadata}
        status={payment.status}
        actions={[
          {
            label: 'Edit Payment',
            icon: Edit,
            onClick: () => router.push(`/financials/payments/${payment.id}/edit`),
          },
        ]}
      />

      {/* Status Update Control */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Update Status:</span>
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
      </div>

      {/* Payment Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <InfoCard
          title="Payment Information"
          items={[
            { label: 'Payment Number', value: payment.payment_number || "N/A" },
            { label: 'Payment ID', value: payment.id },
            { label: 'Amount', value: `$${Number(payment.amount || 0).toFixed(2)}` },
            { label: 'Payment Method', value: payment.payment_method || "N/A" },
            { label: 'Payment Date', value: payment.payment_date ? format(new Date(payment.payment_date), "MMM dd, yyyy") : "N/A" },
            { label: 'Reference Number', value: payment.reference_number || "N/A" },
          ]}
        />

        <InfoCard
          title="Additional Information"
          items={[
            { label: 'Status', value: <StatusBadge status={payment.status} /> },
            { label: 'Client', value: customer?.company_name || customer?.name || "N/A" },
            { label: 'Notes', value: payment.notes || "No notes" },
          ]}
        />
      </div>

      {/* Allocated Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Allocated Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {payment.payment_allocations && payment.payment_allocations.length > 0 ? (
            <div className="w-full">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Invoice</th>
                    <th className="text-left p-2 hidden sm:table-cell">Client</th>
                    <th className="text-right p-2">Allocated Amount</th>
                    <th className="text-left p-2 hidden md:table-cell">Allocation Date</th>
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
                        <td className="p-2 hidden sm:table-cell">
                          {invoiceCustomer?.company_name || invoiceCustomer?.name || "N/A"}
                        </td>
                        <td className="text-right p-2 font-medium text-success">
                          ${Number(allocation.allocated_amount).toFixed(2)}
                        </td>
                        <td className="p-2 hidden md:table-cell">
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
