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
  AlertCircle,
  Save,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LineItemsManager, type LineItem } from "@/components/invoices/LineItemsManager";

export default function NewInvoicePage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState("");
  const [invoiceType, setInvoiceType] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      description: "",
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      discountAmount: 0,
      taxRate: 0,
    },
  ]);

  // Fetch orders with production details
  const { data: ordersData, isLoading: ordersLoading, error } = api.orders.getWithProductionDetails.useQuery({});

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

    if (!dueDate) {
      toast({
        title: "Validation Error",
        description: "Please select a due date.",
        variant: "destructive",
      });
      return;
    }

    if (lineItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one line item.",
        variant: "destructive",
      });
      return;
    }

    // Validate line items
    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      if (!item.description || item.description.trim() === "") {
        toast({
          title: "Validation Error",
          description: `Line item #${i + 1}: Description is required.`,
          variant: "destructive",
        });
        return;
      }
      if (item.quantity <= 0) {
        toast({
          title: "Validation Error",
          description: `Line item #${i + 1}: Quantity must be greater than 0.`,
          variant: "destructive",
        });
        return;
      }
      if (item.unitPrice <= 0) {
        toast({
          title: "Validation Error",
          description: `Line item #${i + 1}: Unit price must be greater than 0.`,
          variant: "destructive",
        });
        return;
      }
    }

    // Create invoice with line items
    createInvoiceMutation.mutate({
      lineItems: lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent || 0,
        discountAmount: item.discountAmount || 0,
        taxRate: item.taxRate || 0,
      })),
    });
  };

  const isFormValid =
    orderId &&
    invoiceType &&
    dueDate &&
    lineItems.length > 0 &&
    lineItems.every(item =>
      item.description.trim() !== "" &&
      item.quantity > 0 &&
      item.unitPrice > 0
    );

  // Handle errors
  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-5xl">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <AlertTriangle className="w-12 h-12 text-destructive" aria-hidden="true" />
          <h2 className="text-2xl font-semibold">Failed to Load Orders</h2>
          <p className="text-muted-foreground text-center max-w-md">
            {error.message || "An unexpected error occurred while loading orders data."}
          </p>
          <button
            onClick={() => utils.orders.getWithProductionDetails.invalidate()}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
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
              <p className="text-muted-foreground">Generate an invoice with multiple line items</p>
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invoice Information Card */}
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
                    {ordersData?.items?.map((order: any) => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.order_number || order.id} {order.customer?.company_name || order.customer?.name ? `- ${order.customer.company_name || order.customer.name}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Invoice Type and Due Date */}
              <div className="grid grid-cols-2 gap-4">
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

          {/* Line Items Manager */}
          <LineItemsManager
            lineItems={lineItems}
            onChange={setLineItems}
            disabled={createInvoiceMutation.isPending}
          />

          {/* Actions */}
          <div className="flex items-center justify-between">
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
              size="lg"
            >
              {createInvoiceMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  Creating Invoice...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" aria-hidden="true" />
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
