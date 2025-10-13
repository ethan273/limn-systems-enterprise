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
  FileText,
  DollarSign,
  Plus,
  AlertCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function NewInvoicePage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState("");
  const [invoiceType, setInvoiceType] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch orders with production details
  const { data: ordersData, isLoading: ordersLoading } = api.orders.getWithProductionDetails.useQuery();

  const utils = api.useUtils();

  // Create invoice mutation
  const createInvoiceMutation = api.invoices.create.useMutation({
    onSuccess: (data) => {
      // Invalidate cache
      void utils.invoices.getAll.invalidate();

      toast({
        title: "Invoice Created",
        description: data.message || "Invoice created successfully",
      });
      router.push(`/financials/invoices/${data.invoice.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  const handleBack = () => {
    router.push("/financials/invoices");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!orderId) {
      toast({
        title: "Validation Error",
        description: "Please select an order.",
        variant: "destructive",
      });
      return;
    }

    if (!invoiceType) {
      toast({
        title: "Validation Error",
        description: "Please select an invoice type.",
        variant: "destructive",
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid amount greater than 0.",
        variant: "destructive",
      });
      return;
    }

    if (!dueDate) {
      toast({
        title: "Validation Error",
        description: "Please select a due date.",
        variant: "destructive",
      });
      return;
    }

    // Create invoice
    createInvoiceMutation.mutate({
      orderId,
      invoiceType,
      amount: parseFloat(amount),
      dueDate,
      notes: notes.trim() || undefined,
    });
  };

  const isFormValid = orderId && invoiceType && amount && parseFloat(amount) > 0 && dueDate;

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
              disabled={createInvoiceMutation.isPending}
            >
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Create New Invoice</h1>
              <p className="text-muted-foreground">Generate an invoice for an order</p>
            </div>
          </div>
        </div>

        {/* Auto-generation Notice */}
        <Alert>
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            The invoice number will be automatically generated when you create the invoice.
          </AlertDescription>
        </Alert>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Invoice Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Order Selection */}
              <div className="space-y-2">
                <Label htmlFor="order" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" aria-hidden="true" />
                  Order
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Select
                  value={orderId}
                  onValueChange={setOrderId}
                  disabled={ordersLoading || createInvoiceMutation.isPending}
                >
                  <SelectTrigger id="order">
                    <SelectValue placeholder="Select an order" />
                  </SelectTrigger>
                  <SelectContent>
                    {ordersData?.orders?.map((order: { id: string; order_number: string; customer?: { company_name?: string; name?: string } }) => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.order_number} {order.customer?.company_name || order.customer?.name ? `- ${order.customer.company_name || order.customer.name}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Invoice Type */}
              <div className="space-y-2">
                <Label htmlFor="invoice-type">
                  Invoice Type
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Select
                  value={invoiceType}
                  onValueChange={setInvoiceType}
                  disabled={createInvoiceMutation.isPending}
                >
                  <SelectTrigger id="invoice-type">
                    <SelectValue placeholder="Select invoice type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                    <SelectItem value="full">Full Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" aria-hidden="true" />
                  Amount
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={createInvoiceMutation.isPending}
                />
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label htmlFor="due-date">
                  Due Date
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={createInvoiceMutation.isPending}
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
                  disabled={createInvoiceMutation.isPending}
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
              disabled={createInvoiceMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || createInvoiceMutation.isPending}
            >
              {createInvoiceMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                  Create Invoice
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
