'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, X, AlertCircle, Package } from 'lucide-react';
import { PageHeader, LoadingState } from '@/components/common';
import { toast } from 'sonner';

export default function EditProductionOrderPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: orderData, isLoading } = api.productionOrders.getById.useQuery({
    id: orderId,
  });

  const [formData, setFormData] = useState({
    order_number: '',
    item_name: '',
    quantity: '',
    status: 'pending',
    notes: '',
  });

  useEffect(() => {
    if (orderData) {
      setFormData({
        order_number: orderData.order_number || '',
        item_name: orderData.item_name || '',
        quantity: orderData.quantity?.toString() || '',
        status: orderData.status || 'pending',
        notes: orderData.notes || '',
      });
    }
  }, [orderData]);

  const updateOrder = api.productionOrders.update.useMutation({
    onSuccess: () => {
      toast.success('Production order updated successfully');
      router.push(`/production/orders/${orderId}`);
    },
    onError: (err) => {
      setError(err.message || 'Failed to update production order');
      setIsSubmitting(false);
      toast.error('Failed to update production order');
    },
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!formData.order_number || !formData.quantity) {
      setError('Order number and quantity are required');
      setIsSubmitting(false);
      return;
    }

    updateOrder.mutate({
      id: orderId,
      data: {
        order_number: formData.order_number,
        item_name: formData.item_name || undefined,
        quantity: parseInt(formData.quantity),
        status: formData.status,
        notes: formData.notes || undefined,
      },
    });
  };

  const handleCancel = () => {
    router.push(`/production/orders/${orderId}`);
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingState message="Loading production order..." size="lg" />
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="page-container">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
          <p className="text-muted-foreground">Production order not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Edit Production Order"
        subtitle={`Update order ${orderData.order_number}`}
      />

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <span className="text-destructive font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="order_number">Order Number *</Label>
                <Input
                  id="order_number"
                  value={formData.order_number}
                  onChange={(e) => handleChange('order_number', e.target.value)}
                  placeholder="PO-2024-001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)}
                  placeholder="100"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="item_name">Item Name</Label>
                <Input
                  id="item_name"
                  value={formData.item_name}
                  onChange={(e) => handleChange('item_name', e.target.value)}
                  placeholder="Product name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                onClick={handleCancel}
                variant="outline"
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.order_number || !formData.quantity}
                className="btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
