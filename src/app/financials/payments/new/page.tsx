"use client";

import React, { useState } from "react";
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
  CreditCard,
  DollarSign,
  Plus,
  AlertCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function NewPaymentPage() {
  const router = useRouter();
  const [invoiceId, setInvoiceId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch unpaid/partial invoices
  const { data: invoicesData, isLoading: invoicesLoading } = api.invoices.getAll.useQuery({
    limit: 100,
  });

  const utils = api.useUtils();

  // Record payment mutation
  const recordPaymentMutation = api.payments.recordPayment.useMutation({
    onSuccess: (data) => {
      // Invalidate cache
      void utils.payments.getAll.invalidate();
      void utils.invoices.getAll.invalidate();

      toast({
        title: "Payment Recorded",
        description: data.message || "Payment recorded successfully",
      });
      router.push(`/financials/payments/${data.payment.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record payment",
        variant: "destructive",
      });
    },
  });

  const handleBack = () => {
    router.push("/financials/payments");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!invoiceId) {
      toast({
        title: "Validation Error",
        description: "Please select an invoice.",
        variant: "destructive",
      });
      return;
    }

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid payment amount greater than 0.",
        variant: "destructive",
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: "Validation Error",
        description: "Please select a payment method.",
        variant: "destructive",
      });
      return;
    }

    if (!paymentDate) {
      toast({
        title: "Validation Error",
        description: "Please select a payment date.",
        variant: "destructive",
      });
      return;
    }

    // Record payment
    recordPaymentMutation.mutate({
      invoiceId,
      paymentAmount: parseFloat(paymentAmount),
      paymentMethod,
      paymentDate,
      referenceNumber: referenceNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  const isFormValid = invoiceId && paymentAmount && parseFloat(paymentAmount) > 0 && paymentMethod && paymentDate;

  // Filter to unpaid or partially paid invoices
  const unpaidInvoices = invoicesData?.items?.filter((invoice: { payment_status: string }) =>
    invoice.payment_status === 'unpaid' || invoice.payment_status === 'partial'
  ) || [];

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
              disabled={recordPaymentMutation.isPending}
            >
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Record New Payment</h1>
              <p className="text-muted-foreground">Record a payment for an invoice</p>
            </div>
          </div>
        </div>

        {/* Auto-generation Notice */}
        <Alert>
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            The payment ID will be automatically generated when you record the payment.
          </AlertDescription>
        </Alert>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Invoice Selection */}
              <div className="space-y-2">
                <Label htmlFor="invoice" className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" aria-hidden="true" />
                  Invoice
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Select
                  value={invoiceId}
                  onValueChange={setInvoiceId}
                  disabled={invoicesLoading || recordPaymentMutation.isPending}
                >
                  <SelectTrigger id="invoice">
                    <SelectValue placeholder="Select an invoice to pay" />
                  </SelectTrigger>
                  <SelectContent>
                    {unpaidInvoices.length === 0 ? (
                      <SelectItem value="none" disabled>No unpaid invoices available</SelectItem>
                    ) : (
                      unpaidInvoices.map((invoice: { id: string; invoice_number: string; amount_due: number; payment_status: string }) => (
                        <SelectItem key={invoice.id} value={invoice.id}>
                          {invoice.invoice_number} - ${invoice.amount_due ? Number(invoice.amount_due).toFixed(2) : '0.00'} ({invoice.payment_status})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Amount */}
              <div className="space-y-2">
                <Label htmlFor="payment-amount" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" aria-hidden="true" />
                  Payment Amount
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="payment-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  disabled={recordPaymentMutation.isPending}
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="payment-method">
                  Payment Method
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Select
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  disabled={recordPaymentMutation.isPending}
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
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="payment-date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  disabled={recordPaymentMutation.isPending}
                />
              </div>

              {/* Reference Number */}
              <div className="space-y-2">
                <Label htmlFor="reference-number">Reference Number (Optional)</Label>
                <Input
                  id="reference-number"
                  placeholder="e.g., Check number, transaction ID"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  disabled={recordPaymentMutation.isPending}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={recordPaymentMutation.isPending}
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
              disabled={recordPaymentMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || recordPaymentMutation.isPending}
            >
              {recordPaymentMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  Recording...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                  Record Payment
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
