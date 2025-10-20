'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, ShoppingCart, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_production', label: 'In Production' },
  { value: 'ready_to_ship', label: 'Ready to Ship' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export default function EditOrderPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [customerId, setCustomerId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [status, setStatus] = useState('pending');
  const [priority, setPriority] = useState('normal');
  const [dueDate, setDueDate] = useState('');
  const [rushOrder, setRushOrder] = useState(false);
  const [notes, setNotes] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [invoiceSent, setInvoiceSent] = useState(false);
  const [paymentReceived, setPaymentReceived] = useState(false);

  const utils = api.useUtils();

  // Fetch order data
  const { data: order, isLoading: isLoadingOrder, error } = api.orders.getById.useQuery(
    { id: orderId },
    { enabled: !!orderId }
  );

  // Fetch customers for dropdown
  const { data: customersData } = api.customers.getAll.useQuery({
    limit: 100,
    offset: 0,
  });

  // Fetch projects for dropdown
  const { data: projectsData } = api.projects.getAll.useQuery({
    limit: 100,
    offset: 0,
  });

  // Fetch collections for dropdown
  const { data: collectionsData } = api.products.getAllCollections.useQuery();

  // Update order mutation
  const updateOrderMutation = api.orders.update.useMutation({
    onSuccess: (data) => {
      void utils.orders.getAll.invalidate();
      void utils.orders.getById.invalidate({ id: orderId });
      void utils.orders.getWithProductionDetails.invalidate();

      toast({
        title: 'Order Updated',
        description: `Order "${data.order_number}" updated successfully`,
      });
      router.push('/crm/orders');
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update order',
        variant: 'destructive',
      });
    },
  });

  // Populate form when order data loads
  useEffect(() => {
    if (order) {
      setCustomerId(order.customer_id || '');
      setProjectId(order.project_id || '');
      setCollectionId(order.collection_id || '');
      setStatus(order.status || 'pending');
      setPriority(order.priority || 'normal');
      setDueDate(order.due_date ? new Date(order.due_date).toISOString().split('T')[0] : '');
      setRushOrder(order.rush_order ?? false);
      setNotes(order.notes || '');
      setTotalAmount(order.total_amount ? order.total_amount.toString() : '');
      setInvoiceSent(order.invoice_sent ?? false);
      setPaymentReceived(order.payment_received ?? false);
    }
  }, [order]);

  const handleBack = () => {
    router.push('/crm/orders');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!customerId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a client.',
        variant: 'destructive',
      });
      return;
    }

    if (!projectId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a project.',
        variant: 'destructive',
      });
      return;
    }

    if (totalAmount && parseFloat(totalAmount) < 0) {
      toast({
        title: 'Validation Error',
        description: 'Total amount cannot be negative.',
        variant: 'destructive',
      });
      return;
    }

    updateOrderMutation.mutate({
      id: orderId,
      data: {
        customer_id: customerId,
        project_id: projectId,
        collection_id: collectionId || undefined,
        status: status as 'draft' | 'pending' | 'confirmed' | 'in_production' | 'ready_to_ship' | 'shipped' | 'delivered' | 'completed' | 'cancelled',
        priority: priority as 'low' | 'normal' | 'high' | 'urgent',
        due_date: dueDate ? new Date(dueDate) : undefined,
        rush_order: rushOrder,
        notes: notes.trim() || undefined,
        total_amount: totalAmount ? parseFloat(totalAmount) : undefined,
        invoice_sent: invoiceSent,
        payment_received: paymentReceived,
      },
    });
  };

  const isLoading = updateOrderMutation.isPending;

  // Filter projects by selected client
  const filteredProjects = projectsData?.items?.filter(
    (project: any) => !customerId || project.customer_id === customerId
  ) || [];

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="page-title">Error</h1>
            <p className="page-subtitle text-destructive">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingOrder) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading order...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handleBack}
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="page-title">Edit Order</h1>
            <p className="page-subtitle">
              Update order details for {order?.order_number}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Order Number (read-only) */}
            <div className="space-y-2">
              <Label>Order Number</Label>
              <div className="h-10 px-3 py-2 rounded-md border bg-muted font-mono">
                {order?.order_number}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer">
                  Client <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={customerId}
                  onValueChange={(value) => {
                    setCustomerId(value);
                    // Reset project when client changes
                    if (value !== customerId) {
                      setProjectId('');
                    }
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger id="customer">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {customersData?.items?.map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project">
                  Project <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={projectId}
                  onValueChange={setProjectId}
                  disabled={isLoading || !customerId}
                >
                  <SelectTrigger id="project">
                    <SelectValue placeholder={customerId ? "Select project" : "Select client first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProjects.map((project: any) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="collection">Collection</Label>
                <Select
                  value={collectionId}
                  onValueChange={setCollectionId}
                  disabled={isLoading}
                >
                  <SelectTrigger id="collection">
                    <SelectValue placeholder="Select collection (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {collectionsData?.map((collection: any) => (
                      <SelectItem key={collection.id} value={collection.id}>
                        {collection.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus} disabled={isLoading}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority} disabled={isLoading}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalAmount">Total Amount</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="0.00"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="rushOrder">Rush Order</Label>
                  <p className="text-sm text-muted-foreground">
                    Mark this order as high priority
                  </p>
                </div>
                <Switch
                  id="rushOrder"
                  checked={rushOrder}
                  onCheckedChange={setRushOrder}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="invoiceSent">Invoice Sent</Label>
                  <p className="text-sm text-muted-foreground">
                    Invoice has been sent to client
                  </p>
                </div>
                <Switch
                  id="invoiceSent"
                  checked={invoiceSent}
                  onCheckedChange={setInvoiceSent}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="paymentReceived">Payment Received</Label>
                  <p className="text-sm text-muted-foreground">
                    Payment has been received from client
                  </p>
                </div>
                <Switch
                  id="paymentReceived"
                  checked={paymentReceived}
                  onCheckedChange={setPaymentReceived}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about this order"
                disabled={isLoading}
                rows={4}
              />
            </div>

            {/* Display timestamps */}
            <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">Created At</Label>
                <p className="text-sm">
                  {order?.created_at
                    ? new Date(order.created_at).toLocaleString()
                    : '—'}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">Last Updated</Label>
                <p className="text-sm">
                  {order?.updated_at
                    ? new Date(order.updated_at).toLocaleString()
                    : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
