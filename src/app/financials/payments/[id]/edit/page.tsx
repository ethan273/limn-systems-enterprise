"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  ArrowLeft,
  Loader2,
  Save,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { LoadingState, EmptyState } from "@/components/common";

export const dynamic = 'force-dynamic';

interface EditPaymentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditPaymentPage({ params }: EditPaymentPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: '',
    paymentDate: '',
    referenceNumber: '',
    notes: '',
  });

  const utils = api.useUtils();

  // Fetch the existing payment
  const { data: payment, isLoading: paymentLoading, error: paymentError } = api.payments.getById.useQuery(
    { id },
    { enabled: !!id }
  );

  // Populate form when payment loads
  useEffect(() => {
    if (payment) {
      setFormData({
        amount: payment.amount ? payment.amount.toString() : '',
        paymentMethod: payment.payment_method || '',
        paymentDate: payment.payment_date
          ? new Date(payment.payment_date).toISOString().split('T')[0]
          : '',
        referenceNumber: payment.reference_number || '',
        notes: payment.notes || '',
      });
    }
  }, [payment]);

  // Update payment mutation
  const updatePaymentMutation = api.payments.update.useMutation({
    onSuccess: () => {
      // Invalidate cache
      void utils.payments.getById.invalidate({ id });
      void utils.payments.getAll.invalidate();

      toast({
        title: "Payment Updated",
        description: "Payment updated successfully",
      });
      router.push(`/financials/payments/${id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment",
        variant: "destructive",
      });
    },
  });

  const handleBack = () => {
    router.push(`/financials/payments/${id}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid payment amount greater than 0.",
        variant: "destructive",
      });
      return;
    }

    // Update payment
    updatePaymentMutation.mutate({
      id,
      amount: parseFloat(formData.amount),
      paymentMethod: formData.paymentMethod || undefined,
      paymentDate: formData.paymentDate || undefined,
      referenceNumber: formData.referenceNumber || undefined,
      notes: formData.notes || undefined,
    });
  };

  const isFormValid = formData.amount && parseFloat(formData.amount) > 0;

  // Loading state
  if (paymentLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading payment..." size="lg" />
      </div>
    );
  }

  // Error handling for payment query
  if (paymentError || !payment) {
    return (
      <div className="page-container">
        <EmptyState
          icon={AlertTriangle}
          title={paymentError ? "Failed to Load Payment" : "Payment Not Found"}
          description={paymentError?.message || "The payment you're looking for doesn't exist or you don't have permission to view it."}
          action={{
            label: paymentError ? 'Try Again' : 'Back to Payments',
            onClick: () => paymentError ? utils.payments.getById.invalidate() : router.push("/financials/payments"),
            icon: paymentError ? RefreshCw : ArrowLeft,
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              disabled={updatePaymentMutation.isPending}
            >
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Edit Payment</h1>
              <p className="text-muted-foreground">Update payment #{payment.payment_number || payment.id.substring(0, 8)}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">
                  Payment Amount
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  disabled={updatePaymentMutation.isPending}
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                  disabled={updatePaymentMutation.isPending}
                >
                  <SelectTrigger id="payment-method">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wire_transfer">Wire Transfer</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Date */}
              <div className="space-y-2">
                <Label htmlFor="payment-date">
                  Payment Date
                </Label>
                <Input
                  id="payment-date"
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  disabled={updatePaymentMutation.isPending}
                />
              </div>

              {/* Reference Number */}
              <div className="space-y-2">
                <Label htmlFor="reference-number">Reference Number (Optional)</Label>
                <Input
                  id="reference-number"
                  placeholder="e.g., Check number, transaction ID"
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                  disabled={updatePaymentMutation.isPending}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  disabled={updatePaymentMutation.isPending}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={updatePaymentMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || updatePaymentMutation.isPending}
            >
              {updatePaymentMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" aria-hidden="true" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
