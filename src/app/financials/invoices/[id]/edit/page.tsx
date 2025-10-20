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

interface EditInvoicePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditInvoicePage({ params }: EditInvoicePageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [formData, setFormData] = useState({
    due_date: '',
    invoice_notes: '',
    payment_terms: 'Net 30',
    internal_notes: '',
  });

  const utils = api.useUtils();

  // Fetch the existing invoice
  const { data: invoice, isLoading: invoiceLoading, error: invoiceError } = api.invoices.getById.useQuery(
    { id },
    { enabled: !!id }
  );

  // Populate form when invoice loads
  useEffect(() => {
    if (invoice) {
      setFormData({
        due_date: invoice.due_date
          ? new Date(invoice.due_date).toISOString().split('T')[0]
          : '',
        invoice_notes: invoice.invoice_notes || '',
        payment_terms: invoice.payment_terms || 'Net 30',
        internal_notes: invoice.internal_notes || '',
      });
    }
  }, [invoice]);

  // Update invoice mutation
  const updateInvoiceMutation = api.invoices.update.useMutation({
    onSuccess: () => {
      // Invalidate cache
      void utils.invoices.getById.invalidate({ id });
      void utils.invoices.getAll.invalidate();

      toast({
        title: "Invoice Updated",
        description: "Invoice updated successfully",
      });
      router.push(`/financials/invoices/${id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update invoice",
        variant: "destructive",
      });
    },
  });

  const handleBack = () => {
    router.push(`/financials/invoices/${id}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Update invoice
    updateInvoiceMutation.mutate({
      id,
      ...formData,
    });
  };

  // Loading state
  if (invoiceLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading invoice..." size="lg" />
      </div>
    );
  }

  // Error handling for invoice query
  if (invoiceError || !invoice) {
    return (
      <div className="page-container">
        <EmptyState
          icon={AlertTriangle}
          title={invoiceError ? "Failed to Load Invoice" : "Invoice Not Found"}
          description={invoiceError?.message || "The invoice you're looking for doesn't exist or you don't have permission to view it."}
          action={{
            label: invoiceError ? 'Try Again' : 'Back to Invoices',
            onClick: () => invoiceError ? utils.invoices.getById.invalidate() : router.push("/financials/invoices"),
            icon: invoiceError ? RefreshCw : ArrowLeft,
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
              disabled={updateInvoiceMutation.isPending}
            >
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Edit Invoice</h1>
              <p className="text-muted-foreground">Update invoice #{invoice.id.substring(0, 8)}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Invoice Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Due Date */}
              <div className="space-y-2">
                <Label htmlFor="due-date">
                  Due Date
                </Label>
                <Input
                  id="due-date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  disabled={updateInvoiceMutation.isPending}
                />
              </div>

              {/* Payment Terms */}
              <div className="space-y-2">
                <Label htmlFor="payment-terms">Payment Terms</Label>
                <Select
                  value={formData.payment_terms}
                  onValueChange={(value) => setFormData({ ...formData, payment_terms: value })}
                  disabled={updateInvoiceMutation.isPending}
                >
                  <SelectTrigger id="payment-terms">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Net 15">Net 15</SelectItem>
                    <SelectItem value="Net 30">Net 30</SelectItem>
                    <SelectItem value="Net 45">Net 45</SelectItem>
                    <SelectItem value="Net 60">Net 60</SelectItem>
                    <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Invoice Notes */}
              <div className="space-y-2">
                <Label htmlFor="invoice-notes">Invoice Notes (Optional)</Label>
                <Textarea
                  id="invoice-notes"
                  placeholder="Notes visible to customer..."
                  value={formData.invoice_notes}
                  onChange={(e) => setFormData({ ...formData, invoice_notes: e.target.value })}
                  disabled={updateInvoiceMutation.isPending}
                  rows={3}
                />
              </div>

              {/* Internal Notes */}
              <div className="space-y-2">
                <Label htmlFor="internal-notes">Internal Notes (Optional)</Label>
                <Textarea
                  id="internal-notes"
                  placeholder="Internal notes (not visible to customer)..."
                  value={formData.internal_notes}
                  onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                  disabled={updateInvoiceMutation.isPending}
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
              disabled={updateInvoiceMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateInvoiceMutation.isPending}
            >
              {updateInvoiceMutation.isPending ? (
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
